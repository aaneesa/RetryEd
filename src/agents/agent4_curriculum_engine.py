"""
Agent 4 — Curriculum Engine (Topological Sort)
ReAct (manual): Thought → Action → Observe — guaranteed sequential execution.
LLM (Groq) drives reasoning; algorithmic tools handle sorting and formatting.
"""

import json
from collections import defaultdict, deque
from typing import List, Dict

from langchain_groq import ChatGroq


GAGNE_EVENTS = [
    "1. Gain attention",
    "2. Inform learner of objectives",
    "3. Stimulate recall of prior learning",
    "4. Present the content",
    "5. Provide learning guidance",
    "6. Elicit performance (practice)",
    "7. Provide feedback",
    "8. Assess performance",
    "9. Enhance retention and transfer",
]

# ─────────────────────────────────────────────────────────────────────────────
# ReAct helpers
# ─────────────────────────────────────────────────────────────────────────────

def _thought(llm: ChatGroq, context: str) -> str:
    resp = llm.invoke(
        f"You are Agent 4 — Curriculum Engine. Context:\n{context}\n"
        "In one sentence, explain WHY you are taking the next step."
    )
    return resp.content.strip()


def _react_step(label: str, thought: str, fn, verbose: bool):
    if verbose:
        print(f"\n  [THOUGHT]  {thought}")
        print(f"  [ACTION]   {label}")
    result = fn()
    if verbose:
        print(f"  [OBSERVE]  {result if isinstance(result, str) else 'Data processed'}")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Tool functions
# ─────────────────────────────────────────────────────────────────────────────

def _merge_pipeline_data(graph_nodes: List[Dict], scorer_output: List[Dict], miner_output: List[Dict]):
    score_map = {s["id"]: s for s in scorer_output}
    title_map = {m["id"]: m.get("concept_title","") for m in miner_output}
    ctype_map = {m["id"]: m.get("concept_type","fact") for m in miner_output}
    
    pipeline_nodes = []
    for gn in graph_nodes:
        nid = gn["id"]
        sc  = score_map.get(nid, {})
        pipeline_nodes.append({
            "id":            nid,
            "concept_title": title_map.get(nid, nid),
            "concept_type":  ctype_map.get(nid, "fact"),
            "D":             gn["D"],
            "prerequisites": gn["prerequisites"],
            "A":             sc.get("A",     5.0),
            "U":             sc.get("U",     5.0),
            "alpha":         sc.get("alpha", 1.0),
            "beta":          sc.get("beta",  1.0),
            "gamma":         sc.get("gamma", 1.0),
            "Pn":            0.0,
        })
    return pipeline_nodes


def _compute_pn_scores(nodes: List[Dict]):
    for n in nodes:
        n["Pn"] = round(n["D"] * n["alpha"] + n["A"] * n["beta"] + n["U"] * n["gamma"], 4)
    return nodes


def _kahns_topological_sort(nodes: List[Dict]):
    node_map    = {n["id"]: n for n in nodes}
    in_degree:  Dict[str, int]       = defaultdict(int)
    dependents: Dict[str, List[str]] = defaultdict(list)

    for n in nodes:
        nid = n["id"]
        if nid not in in_degree:
            in_degree[nid] = 0
        for pid in n["prerequisites"]:
            if pid in node_map:
                in_degree[nid] += 1
                dependents[pid].append(nid)

    def sort_key(nid):
        nd = node_map.get(nid, {})
        return (nd.get("Pn", 0), nd.get("D", 0))

    queue = deque(sorted([nid for nid, d in in_degree.items() if d == 0], key=sort_key))
    order: List[str] = []

    while queue:
        nid = queue.popleft()
        order.append(nid)
        children = sorted(dependents.get(nid, []), key=sort_key)
        for child in children:
            in_degree[child] -= 1
            if in_degree[child] == 0:
                inserted = sorted(list(queue) + [child], key=sort_key)
                queue = deque(inserted)
    return order


def _format_curriculum(order: List[str], nodes: List[Dict], miner_output: List[Dict]):
    node_map = {n["id"]: n for n in nodes}
    text_map = {m["id"]: m.get("raw_text","") for m in miner_output}
    
    curriculum = []
    for rank, nid in enumerate(order, start=1):
        n = node_map.get(nid, {})
        curriculum.append({
            "rank":          rank,
            "id":            nid,
            "concept_title": n.get("concept_title", nid),
            "concept_type":  n.get("concept_type",  "fact"),
            "D":             n.get("D",  0),
            "Pn":            n.get("Pn", 0),
            "A":             n.get("A",  0),
            "U":             n.get("U",  0),
            "raw_text":      text_map.get(nid, ""),
            "prerequisites": n.get("prerequisites", []),
            "gagne_events":  GAGNE_EVENTS,
        })
    return curriculum


# ─────────────────────────────────────────────────────────────────────────────
# Agent runner
# ─────────────────────────────────────────────────────────────────────────────

def run_curriculum_engine(
    graph_nodes: List[Dict],
    scorer_output: List[Dict],
    miner_output: List[Dict],
    groq_llm: ChatGroq,
    verbose: bool = True
) -> List[Dict]:
    if verbose:
        print("\n  ── ReAct Trace: Agent 4 — Curriculum Engine ──")

    # Step 1
    pipeline_nodes = _react_step(
        label="merge_pipeline_data",
        thought=_thought(groq_llm, "Have data from all previous agents, need to merge for sorting") if verbose else "",
        fn=lambda: _merge_pipeline_data(graph_nodes, scorer_output, miner_output),
        verbose=verbose,
    )

    # Step 2
    pipeline_nodes = _react_step(
        label="compute_pn_scores",
        thought=_thought(groq_llm, "Pn scores determine priority, need to calculate them using weights and cognitive metrics") if verbose else "",
        fn=lambda: _compute_pn_scores(pipeline_nodes),
        verbose=verbose,
    )

    # Step 3
    order = _react_step(
        label="kahns_topological_sort",
        thought=_thought(groq_llm, "Need to find the optimal learning sequence using topological sort and Pn tie-breaking") if verbose else "",
        fn=lambda: _kahns_topological_sort(pipeline_nodes),
        verbose=verbose,
    )

    # Step 4
    curriculum = _react_step(
        label="format_curriculum",
        thought=_thought(groq_llm, "Final step: format the ordered nodes into a curriculum aligned with Gagne's principles") if verbose else "",
        fn=lambda: _format_curriculum(order, pipeline_nodes, miner_output),
        verbose=verbose,
    )

    if verbose:
        print(f"\n  ── Agent 4 done. {len(curriculum)} lessons generated. ──")

    return curriculum
