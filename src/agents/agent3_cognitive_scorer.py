"""
Agent 3 — Cognitive Scorer
ReAct (manual): Thought → Action → Observe — guaranteed sequential execution.
Groq LLM used BOTH for reasoning trace AND batched scoring (A, U).
"""

import re, json
from typing import List, Dict

from langchain_groq import ChatGroq


BATCH_SIZE = 25
WEIGHT_MAP = {
    "definition": (1.0, 1.5, 1.0),
    "procedure":  (1.5, 1.0, 0.8),
    "principle":  (1.0, 1.2, 1.5),
    "example":    (0.8, 0.8, 1.0),
    "fact":       (1.0, 1.0, 1.0),
}


# ─────────────────────────────────────────────────────────────────────────────
# ReAct helpers
# ─────────────────────────────────────────────────────────────────────────────

def _thought(llm: ChatGroq, context: str) -> str:
    resp = llm.invoke(
        f"You are Agent 3 — Cognitive Scorer. Context:\n{context}\n"
        "In one sentence, explain WHY you are taking the next step."
    )
    return resp.content.strip()


def _react_step(label: str, thought: str, fn, verbose: bool):
    if verbose:
        print(f"\n  [THOUGHT]  {thought}")
        print(f"  [ACTION]   {label}")
    result = fn()
    if verbose:
        obs = result if isinstance(result, str) else str(result[0])[:120]
        print(f"  [OBSERVE]  {obs}")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Tool functions
# ─────────────────────────────────────────────────────────────────────────────

def _enrich_nodes_with_text(graph_nodes: List[Dict], miner_output: List[Dict]):
    text_map = {
        mo["id"]: {"raw_text": mo.get("raw_text",""), "concept_type": mo.get("concept_type","fact")}
        for mo in miner_output
    }
    enriched = [
        {
            "id":           gn["id"],
            "D":            gn["D"],
            "raw_text":     text_map.get(gn["id"], {}).get("raw_text", ""),
            "concept_type": text_map.get(gn["id"], {}).get("concept_type", "fact"),
        }
        for gn in graph_nodes
    ]
    return enriched, f"Enriched {len(enriched)} node(s) with raw_text and concept_type."


def _partition_into_batches(enriched: List[Dict]):
    batches = [enriched[i: i + BATCH_SIZE] for i in range(0, len(enriched), BATCH_SIZE)]
    return batches, f"Partitioned into {len(batches)} batch(es) of ~{BATCH_SIZE}."


def _score_batch(batch: List[Dict], llm: ChatGroq) -> List[Dict]:
    """Call Groq LLM to score A (Abstraction) and U (Uncertainty) for a batch."""
    nodes_json = json.dumps(
        [{"id": n["id"], "raw_text": n["raw_text"]} for n in batch], indent=2
    )
    prompt = (
        "You are a cognitive load analyst for instructional design.\n"
        "Score EACH concept node:\n"
        "  A (Abstraction): 0=very concrete, 10=highly abstract/theoretical\n"
        "  U (Uncertainty): 0=crystal clear, 10=very ambiguous/confusing\n"
        "Return ONLY a JSON array, no other text:\n"
        '[{"id":"<id>","A":<float 0-10>,"U":<float 0-10>},...]\n\n'
        f"NODES:\n{nodes_json}"
    )
    try:
        response = llm.invoke(prompt)
        content  = re.sub(r"```json|```", "", response.content).strip()
        return json.loads(content)
    except Exception:
        return _heuristic_score(batch)


def _calibrate_weights(raw_scores: List[Dict], enriched: List[Dict]) -> tuple:
    ctype_map = {n["id"]: n["concept_type"] for n in enriched}
    for score in raw_scores:
        ctype = ctype_map.get(score.get("id",""), "fact")
        alpha, beta, gamma = WEIGHT_MAP.get(ctype, (1.0, 1.0, 1.0))
        score["alpha"] = alpha
        score["beta"]  = beta
        score["gamma"] = gamma
    return raw_scores, f"Calibrated weights for {len(raw_scores)} node(s)."


def _validate_scores(calibrated: List[Dict]) -> tuple:
    output = [{
        "id":    s.get("id",""),
        "A":     min(10.0, max(0.0, float(s.get("A", 5.0)))),
        "U":     min(10.0, max(0.0, float(s.get("U", 5.0)))),
        "alpha": float(s.get("alpha", 1.0)),
        "beta":  float(s.get("beta",  1.0)),
        "gamma": float(s.get("gamma", 1.0)),
    } for s in calibrated]
    return output, f"Validation complete. {len(output)} node(s) in scorer_output."


def _heuristic_score(batch: List[Dict]) -> List[Dict]:
    abstract_re    = re.compile(r'\b(abstract|theory|principle|model|theorem|formula|framework)\b', re.I)
    concrete_re    = re.compile(r'\b(step|click|open|run|execute|enter|type|press|install)\b', re.I)
    uncertainty_re = re.compile(r'\b(may|might|could|sometimes|often|generally|approximately)\b', re.I)
    passive_re     = re.compile(r'\b(is|are|was|were|been|being)\s+\w+ed\b', re.I)
    results = []
    for n in batch:
        text = n.get("raw_text",""); words = text.split(); wc = max(len(words), 1)
        avg_wl = sum(len(w) for w in words) / wc
        A = min(10.0, max(0.0, len(abstract_re.findall(text))*2.0 - len(concrete_re.findall(text))*1.5 + (avg_wl-4)*0.5 + 3.0))
        U = min(10.0, max(0.0, len(uncertainty_re.findall(text))*1.2 + len(passive_re.findall(text))*0.8 + max(0,(50-wc)/10)))
        results.append({"id": n["id"], "A": round(A,2), "U": round(U,2)})
    return results


# ─────────────────────────────────────────────────────────────────────────────
# Agent runner — guaranteed sequential ReAct loop
# ─────────────────────────────────────────────────────────────────────────────

def run_cognitive_scorer(
    graph_nodes: List[Dict],
    miner_output: List[Dict],
    groq_llm: ChatGroq,
    verbose: bool = True,
) -> List[Dict]:
    if verbose:
        print("\n  ── ReAct Trace: Agent 3 — Cognitive Scorer ──")

    # Step 1
    enriched, obs = _react_step(
        label="enrich_nodes_with_text",
        thought=_thought(groq_llm, f"Have {len(graph_nodes)} graph nodes, need raw_text for LLM scoring") if verbose else "",
        fn=lambda: _enrich_nodes_with_text(graph_nodes, miner_output),
        verbose=verbose,
    )

    # Step 2
    batches, obs = _react_step(
        label="partition_into_batches",
        thought=_thought(groq_llm, f"Have {len(enriched)} enriched nodes, batch to ~{BATCH_SIZE} to avoid token limits") if verbose else "",
        fn=lambda: _partition_into_batches(enriched),
        verbose=verbose,
    )

    # Step 3 — score each batch (repeated ReAct loop)
    all_scores: List[Dict] = []
    for i, batch in enumerate(batches):
        scores = _react_step(
            label=f"score_batch ({i+1}/{len(batches)})",
            thought=_thought(groq_llm, f"Batch {i+1}/{len(batches)} of {len(batch)} nodes ready, call Groq to score A and U") if verbose else "",
            fn=lambda b=batch: _score_batch(b, groq_llm),
            verbose=verbose,
        )
        all_scores.extend(scores)

    # Step 4
    calibrated, obs = _react_step(
        label="calibrate_weights",
        thought=_thought(groq_llm, f"All {len(all_scores)} nodes scored, assign alpha/beta/gamma by concept_type") if verbose else "",
        fn=lambda: _calibrate_weights(all_scores, enriched),
        verbose=verbose,
    )

    # Step 5
    scorer_output, obs = _react_step(
        label="validate_scores",
        thought=_thought(groq_llm, f"Weights calibrated, clamp scores to [0,10] and finalise output") if verbose else "",
        fn=lambda: _validate_scores(calibrated),
        verbose=verbose,
    )

    if verbose:
        print(f"\n  ── Agent 3 done. {len(scorer_output)} nodes scored. ──")

    return scorer_output
