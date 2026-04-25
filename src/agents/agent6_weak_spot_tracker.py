"""
Agent 6 — Weak Spot Tracker
Non-LLM Agent.
Goal: Track potential failure points by flagging nodes with high Uncertainty (U) or Abstraction (A).
"""

from typing import List, Dict

def run_weak_spot_tracker(
    scorer_output: List[Dict],
    threshold_u: float = 7.0,
    threshold_a: float = 7.0,
    verbose: bool = True
) -> List[Dict]:
    """
    Flags nodes where U or A is above the given thresholds.
    """
    if verbose:
        print("\n  ── Agent 6 — Weak Spot Tracker ──")

    weak_spots = []
    for node in scorer_output:
        if node['U'] >= threshold_u or node['A'] >= threshold_a:
            weak_spots.append({
                "node_id": node['id'],
                "risk_level": "high",
                "U": node['U'],
                "A": node['A']
            })

    if verbose:
        print(f"  Flagged {len(weak_spots)} high-risk node(s).")
    
    return weak_spots
