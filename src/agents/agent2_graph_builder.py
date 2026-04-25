"""
Agent 2 — Graph Builder + Depth Engine
ReAct (manual): Thought → Action → Observe — guaranteed sequential execution.
Zero LLM extraction calls; LLM provides the reasoning trace only.
"""

import sys
from collections import defaultdict
from typing import List, Dict, Set

from langchain_groq import ChatGroq


# ─────────────────────────────────────────────────────────────────────────────
# ReAct helpers
# ─────────────────────────────────────────────────────────────────────────────

def _thought(llm: ChatGroq, context: str) -> str:
    resp = llm.invoke(
        f"You are Agent 2 — Graph Builder. Context:\n{context}\n"
        "In one sentence, explain WHY you are taking the next step."
    )
    return resp.content.strip()


def _react_step(label: str, thought: str, fn, verbose: bool):
    if verbose:
        print(f"\n  [THOUGHT]  {thought}")
        print(f"  [ACTION]   {label}")
    result = fn()
    if verbose:
        print(f"  [OBSERVE]  {result}")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Tool functions — pure algorithmic, zero LLM
# ─────────────────────────────────────────────────────────────────────────────

def _build_adjacency_list(miner_output: List[Dict]):
    adj: Dict[str, List[str]] = defaultdict(list)
    all_ids: Set[str] = set()
    for node in miner_output:
        nid = node["id"]
        all_ids.add(nid)
        for pid in node.get("prerequisite_ids", []):
            if pid:
                adj[nid].append(pid)
                all_ids.add(pid)
    total_edges = sum(len(v) for v in adj.values())
    return adj, all_ids, f"Adjacency list: {len(all_ids)} node(s), {total_edges} edge(s)."


def _detect_and_break_cycles(adj: Dict, all_ids: Set[str]):
    WHITE, GREY, BLACK = 0, 1, 2
    colour  = {nid: WHITE for nid in all_ids}
    removed = 0
    sys.setrecursionlimit(10_000)

    def dfs(node: str):
        nonlocal removed
        colour[node] = GREY
        for nb in list(adj.get(node, [])):
            if colour.get(nb, WHITE) == GREY:
                adj[node].remove(nb)
                removed += 1
            elif colour.get(nb, WHITE) == WHITE:
                dfs(nb)
        colour[node] = BLACK

    for nid in list(all_ids):
        if colour.get(nid, WHITE) == WHITE:
            dfs(nid)

    return adj, f"Cycle check done. Removed {removed} back-edge(s). Graph is a DAG."


def _compute_depth_dfs(adj: Dict, all_ids: Set[str]):
    memo: Dict[str, Set[str]] = {}

    def ancestors(node: str) -> Set[str]:
        if node in memo:
            return memo[node]
        result: Set[str] = set()
        for p in adj.get(node, []):
            result.add(p)
            result |= ancestors(p)
        memo[node] = result
        return result

    depth_map = {nid: len(ancestors(nid)) for nid in all_ids}
    max_d = max(depth_map.values(), default=0)
    avg_d = round(sum(depth_map.values()) / max(len(depth_map), 1), 2)
    return depth_map, f"Depth computed for {len(depth_map)} node(s). Max D={max_d}, Avg D={avg_d}."


def _emit_graph_nodes(miner_output: List[Dict], depth_map: Dict) -> tuple:
    seen, nodes = set(), []
    for mo in miner_output:
        nid = mo["id"]
        if nid in seen:
            continue
        seen.add(nid)
        nodes.append({
            "id":            nid,
            "D":             depth_map.get(nid, 0),
            "prerequisites": mo.get("prerequisite_ids", []),
        })
    return nodes, f"Emitted {len(nodes)} graph node(s)."


# ─────────────────────────────────────────────────────────────────────────────
# Agent runner — guaranteed sequential ReAct loop
# ─────────────────────────────────────────────────────────────────────────────

def run_graph_builder(miner_output: List[Dict], groq_llm: ChatGroq, verbose: bool = True) -> List[Dict]:
    if verbose:
        print("\n  ── ReAct Trace: Agent 2 — Graph Builder ──")

    # Step 1
    adj, all_ids, obs = _react_step(
        label="build_adjacency_list",
        thought=_thought(groq_llm, f"Have {len(miner_output)} ALUs, need adjacency list for traversal") if verbose else "",
        fn=lambda: _build_adjacency_list(miner_output),
        verbose=verbose,
    )

    # Step 2
    adj, obs = _react_step(
        label="detect_and_break_cycles",
        thought=_thought(groq_llm, f"Have {len(all_ids)} nodes, must enforce DAG before computing depth") if verbose else "",
        fn=lambda: _detect_and_break_cycles(adj, all_ids),
        verbose=verbose,
    )

    # Step 3
    depth_map, obs = _react_step(
        label="compute_depth_dfs",
        thought=_thought(groq_llm, "Graph is a DAG, compute D(node)=unique ancestor count via memoised DFS") if verbose else "",
        fn=lambda: _compute_depth_dfs(adj, all_ids),
        verbose=verbose,
    )

    # Step 4
    graph_nodes, obs = _react_step(
        label="emit_graph_nodes",
        thought=_thought(groq_llm, f"Depth computed for all nodes, package into graph_nodes for Agent 3") if verbose else "",
        fn=lambda: _emit_graph_nodes(miner_output, depth_map),
        verbose=verbose,
    )

    if verbose:
        print(f"\n  ── Agent 2 done. {len(graph_nodes)} nodes emitted. ──")

    return graph_nodes
