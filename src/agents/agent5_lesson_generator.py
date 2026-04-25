"""
Agent 5 — Lesson Generator (CORE AGENT)
ReAct (manual): Thought → Action → Observe — guaranteed sequential execution.
LLM (Groq) generates high-quality, misconception-driven lessons.
"""

import json
import re
from typing import List, Dict, Optional

from langchain_groq import ChatGroq


# ─────────────────────────────────────────────────────────────────────────────
# ReAct helpers
# ─────────────────────────────────────────────────────────────────────────────

def _thought(llm: ChatGroq, context: str) -> str:
    resp = llm.invoke(
        f"You are Agent 5 — Lesson Generator. Context:\n{context}\n"
        "In one sentence, explain WHY you are taking the next step."
    )
    return resp.content.strip()


def _react_step(label: str, thought: str, fn, verbose: bool):
    if verbose:
        print(f"\n  [THOUGHT]  {thought}")
        print(f"  [ACTION]   {label}")
    result = fn()
    if verbose:
        print(f"  [OBSERVE]  Lesson content generated for node.")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Tool functions
# ─────────────────────────────────────────────────────────────────────────────

def _generate_lesson_content(node: Dict, llm: ChatGroq) -> Dict:
    """Calls Groq to generate a complete lesson object for a single node."""
    
    prompt = f"""
You are an expert pedagogical designer.

Create a detailed lesson for the following concept:
Title: {node.get('concept_title', 'Unknown')}
Type: {node.get('concept_type', 'fact')}
Raw Text: {node.get('raw_text', '')}

Return ONLY valid JSON. No markdown, no explanation, no extra text.

Schema:
{{
  "node_id": "{node.get('id', '')}",
  "misconception": "string",
  "hook": "string",
  "explanation": "string",
  "example": "string",
  "practice": "string",
  "logic_trap_question": {{
    "question": "string",
    "options": ["A", "B", "C", "D"]
  }},
  "expected_wrong_answer": "string",
  "correct_answer": "string",
  "reasoning_paths": {{
    "wrong_1": "string",
    "wrong_2": "string",
    "correct": "string"
  }}
}}"""
    try:
        response = llm.invoke(prompt)
        content = re.sub(r"```json|```", "", response.content).strip()
        return json.loads(content)
    except Exception as e:
        return {
            "node_id": node['id'],
            "error": str(e),
            "explanation": f"Failed to generate lesson for {node['concept_title']}"
        }


# ─────────────────────────────────────────────────────────────────────────────
# Agent runner
# ─────────────────────────────────────────────────────────────────────────────

def run_lesson_generator(
    curriculum: List[Dict],
    groq_llm: ChatGroq,
    verbose: bool = True
) -> List[Dict]:
    if verbose:
        print("\n  ── ReAct Trace: Agent 5 — Lesson Generator ──")

    lessons = []
    for i, node in enumerate(curriculum):
        thought = _thought(groq_llm, f"Generating lesson {i+1}/{len(curriculum)} for node {node['concept_title']}") if verbose else ""
        
        lesson = _react_step(
            label=f"generate_lesson ({node['concept_title']})",
            thought=thought,
            fn=lambda n=node: _generate_lesson_content(n, groq_llm),
            verbose=verbose
        )
        lessons.append(lesson)

    if verbose:
        print(f"\n  ── Agent 5 done. {len(lessons)} lessons generated. ──")

    return lessons
