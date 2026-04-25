"""
Agent 1 — Miner (Concept Extractor)
ReAct (manual): Thought → Action → Observe loop in Python.
LLM (Groq) drives the reasoning trace; tools run sequentially.
"""

import re, uuid, json
from typing import List, Dict, Optional, Callable

from langchain_core.tools import tool
from langchain_groq import ChatGroq


# ─────────────────────────────────────────────────────────────────────────────
# ReAct helpers
# ─────────────────────────────────────────────────────────────────────────────

def _thought(llm: ChatGroq, context: str) -> str:
    """Ask the LLM to reason about the next step and return its thought."""
    resp = llm.invoke(
        f"You are Agent 1 — Miner. Current context:\n{context}\n"
        "In one sentence, explain WHY you are taking the next step."
    )
    return resp.content.strip()


def _react_step(label: str, thought: str, fn, verbose: bool):
    """Run one Thought→Action→Observe cycle."""
    if verbose:
        print(f"\n  [THOUGHT]  {thought}")
        print(f"  [ACTION]   {label}")
    result = fn()
    if verbose:
        print(f"  [OBSERVE]  {result}")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

MAX_TOKENS     = 1500
OVERLAP_TOKENS = 100
CHARS_PER_TOK  = 4


# ─────────────────────────────────────────────────────────────────────────────
# Tool functions (pure Python, called directly — no parallel dispatch issue)
# ─────────────────────────────────────────────────────────────────────────────

def _split_document(text: str) -> tuple[List[str], str]:
    max_c, overlap_c = MAX_TOKENS * CHARS_PER_TOK, OVERLAP_TOKENS * CHARS_PER_TOK
    chunks, start = [], 0
    while start < len(text):
        end = min(start + max_c, len(text))
        chunks.append(text[start:end])
        start += max_c - overlap_c
    return chunks, f"Document split into {len(chunks)} chunk(s) of ~{MAX_TOKENS} tokens."


def _extract_concepts(chunks: List[str]) -> tuple[List[Dict], str]:
    def_re  = re.compile(r'\b(is defined as|refers to|is called|means|is known as)\b', re.I)
    proc_re = re.compile(r'^\s*(\d+[\.\)]\s|[-•]\s)', re.M)
    prin_re = re.compile(r'\b(therefore|thus|it follows|in principle|as a result)\b', re.I)
    pre_re  = re.compile(r'\b(requires|assumes|builds on|depends on|after learning)\b', re.I)

    all_raw: List[Dict] = []
    for i, chunk in enumerate(chunks):
        for sent in re.split(r'(?<=[.!?])\s+', chunk):
            sent = sent.strip()
            if len(sent) < 30:
                continue
            ctype = "fact"
            if def_re.search(sent):    ctype = "definition"
            elif proc_re.search(sent): ctype = "procedure"
            elif prin_re.search(sent): ctype = "principle"

            title   = " ".join(sent.split()[:6]).rstrip(".,;:")
            prereqs = []
            if pre_re.search(sent):
                m = pre_re.search(sent)
                prereqs = [" ".join(sent[m.end():].split()[:4]).rstrip(".,;:")]
            all_raw.append({
                "concept_title":       title,
                "raw_text":            sent,
                "concept_type":        ctype,
                "prerequisite_titles": prereqs,
            })
    return all_raw, f"Extracted {len(all_raw)} raw concept(s) across {len(chunks)} chunk(s)."


def _deduplicate_merge(raw: List[Dict]) -> tuple[List[Dict], str]:
    stop = {"a", "an", "the", "of", "is", "in", "to", "and", "or", "for"}

    def normalise(t: str) -> frozenset:
        return frozenset(
            tok for tok in re.sub(r"[^a-z0-9 ]", "", t.lower()).split() if tok not in stop
        )

    seen: Dict = {}
    for c in raw:
        key = normalise(c.get("concept_title", ""))
        if not key:
            continue
        if key not in seen:
            seen[key] = c
        else:
            ex = seen[key]
            if len(c.get("raw_text", "")) > len(ex.get("raw_text", "")):
                ex["raw_text"] = c["raw_text"]
            ex["prerequisite_titles"] = list(
                set(ex.get("prerequisite_titles", [])) | set(c.get("prerequisite_titles", []))
            )

    deduped = list(seen.values())
    return deduped, f"Deduplicated: {len(raw)} → {len(deduped)} unique concept(s)."


def _resolve_prerequisites(concepts: List[Dict]) -> tuple[List[Dict], str]:
    title_to_id: Dict[str, str] = {}
    for c in concepts:
        cid = str(uuid.uuid4())
        c["_id"] = cid
        title_to_id[c.get("concept_title", "").lower()] = cid

    output = []
    for c in concepts:
        prereq_ids = [
            title_to_id[pt.lower()]
            for pt in c.get("prerequisite_titles", [])
            if pt.lower() in title_to_id
        ]
        output.append({
            "id":               c["_id"],
            "concept_title":    c.get("concept_title", ""),
            "raw_text":         c.get("raw_text", ""),
            "concept_type":     c.get("concept_type", "fact"),
            "prerequisite_ids": prereq_ids,
        })
    return output, f"Resolved prerequisites for {len(output)} concept(s)."


def _validate_output(output: List[Dict]) -> str:
    issues = []
    for c in output:
        if not c.get("id"):            issues.append(f"Missing id: {c.get('concept_title')}")
        if not c.get("concept_title"): issues.append(f"Missing title for: {c.get('id')}")
        if not c.get("raw_text"):      issues.append(f"Empty raw_text: {c.get('concept_title')}")
    if issues:
        return f"FAILED — {len(issues)} issue(s): {issues[:3]}"
    return f"PASSED — {len(output)} clean ALUs ready for Agent 2."


# ─────────────────────────────────────────────────────────────────────────────
# Agent runner — guaranteed sequential ReAct loop
# ─────────────────────────────────────────────────────────────────────────────

def run_miner(raw_text: str, groq_llm: ChatGroq, verbose: bool = True) -> List[Dict]:
    """
    ReAct loop:
      Thought (LLM) → Action (tool call) → Observe (result)
    All steps run sequentially — no parallel dispatch issues.
    """
    if verbose:
        print("\n  ── ReAct Trace: Agent 1 — Miner ──")

    # Step 1
    chunks, obs = _react_step(
        label="split_document",
        thought=_thought(groq_llm, "raw_text loaded, need to chunk it first") if verbose else "",
        fn=lambda: _split_document(raw_text),
        verbose=verbose,
    )

    # Step 2
    raw_concepts, obs = _react_step(
        label="extract_concepts",
        thought=_thought(groq_llm, f"Have {len(chunks)} chunks, extract concepts from each") if verbose else "",
        fn=lambda: _extract_concepts(chunks),
        verbose=verbose,
    )

    # Step 3
    deduped, obs = _react_step(
        label="deduplicate_merge",
        thought=_thought(groq_llm, f"Have {len(raw_concepts)} raw concepts, need to remove duplicates") if verbose else "",
        fn=lambda: _deduplicate_merge(raw_concepts),
        verbose=verbose,
    )

    # Step 4
    miner_output, obs = _react_step(
        label="resolve_prerequisites",
        thought=_thought(groq_llm, f"Have {len(deduped)} unique concepts, assign UUIDs and resolve prereqs") if verbose else "",
        fn=lambda: _resolve_prerequisites(deduped),
        verbose=verbose,
    )

    # Step 5
    validation = _react_step(
        label="validate_output",
        thought=_thought(groq_llm, f"Have {len(miner_output)} ALUs, validate before handoff") if verbose else "",
        fn=lambda: _validate_output(miner_output),
        verbose=verbose,
    )

    if verbose:
        print(f"\n  ── Agent 1 done. {len(miner_output)} ALUs extracted. Validation: {validation} ──")

    return miner_output
