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
You are an expert pedagogical designer specializing in identifying deep-seated cognitive hurdles.

Create a detailed, high-quality lesson for the following concept:
Title: {node.get('concept_title', 'Unknown')}
Type: {node.get('concept_type', 'fact')}
Raw Text: {node.get('raw_text', '')}

Your goal is to identify a GENUINE misconception—not just a simple 'don't know' or 'error', but a specific mental model that is incorrect yet plausible to a beginner.

Return ONLY valid JSON. No markdown, no explanation, no extra text.

Schema:
{{
  "node_id": "{node.get('id', '')}",
  "lesson_title": "A catchy, pedagogical title for this specific lesson (e.g., 'The Secret of X' or 'Mastering Y').",
  "misconception": "A high-quality, specific misconception that students often have about this concept. It should explain the 'wrong logic' clearly.",
  "hook": "An engaging 'Attention Getter' (Gagné's Event 1) to spark curiosity.",
  "explanation": "A clear, concise, and pedagogical explanation of the concept.",
  "example": "A concrete, real-world example illustrating the concept.",
  "practice": "A small practice exercise for the student.",
  "logic_trap_question": {{
    "question": "A multiple-choice question specifically designed to catch the misconception identified above.",
    "options": ["Option A", "Option B", "Option C", "Option D"]
  }},
  "expected_wrong_answer": "The specific option that someone with the misconception would pick.",
  "correct_answer": "The correct option.",
  "reasoning_paths": {{
    "wrong_1": "Explain the faulty logic for a common error.",
    "wrong_2": "Explain the faulty logic related specifically to the 'misconception' field above.",
    "correct": "The step-by-step correct reasoning."
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
