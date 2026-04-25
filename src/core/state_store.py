"""
Shared in-memory state store for the multi-agent pipeline.
Each agent reads from and writes to this store via string-serialized tool I/O.
"""

import json
from typing import Any, Dict

_store: Dict[str, Any] = {}

def set_state(key: str, value: Any):
    _store[key] = value

def get_state(key: str, default: Any = None) -> Any:
    return _store.get(key, default)

def dump_state(key: str) -> str:
    """Serialize state value to JSON string (for LangChain tool output)."""
    val = _store.get(key)
    if val is None:
        return json.dumps({"error": f"No state found for key '{key}'"})
    return json.dumps(val, default=str)

def load_state(key: str, raw: str):
    """Deserialize JSON string and store it."""
    _store[key] = json.loads(raw)
