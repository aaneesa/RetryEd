from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class MinerOutput:
    id: str
    concept_title: str
    raw_text: str
    concept_type: str                    # e.g. "definition", "procedure", "principle"
    prerequisite_ids: List[str] = field(default_factory=list)

@dataclass
class GraphNode:
    id: str
    D: int                               # Depth = recursive upstream dependency count
    prerequisites: List[str] = field(default_factory=list)

@dataclass
class CognitiveScorerOutput:
    id: str
    A: float                             # Abstraction  (0–10)
    U: float                             # Uncertainty  (0–10)
    alpha: float = 1.0                   # weight for D
    beta: float  = 1.0                   # weight for A
    gamma: float = 1.0                   # weight for U

@dataclass
class PipelineNode:
    id: str
    concept_title: str
    raw_text: str
    concept_type: str
    prerequisite_ids: List[str]
    D: float = 0.0
    A: float = 0.0
    U: float = 0.0
    alpha: float = 1.0
    beta: float  = 1.0
    gamma: float = 1.0
    Pn: float = 0.0                      # Final priority score
