"""
Agent 7 — Adaptive Refiner
ReAct (manual): Thought → Action → Observe — guaranteed sequential execution.
Includes:
1. Simulated Student (Mandatory): Attempts the lesson's question once.
2. Adaptive Refiner (Conditional): Rewrites weak parts if the student fails.
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
        f"You are Agent 7 — Adaptive Refiner. Context:\n{context}\n"
        "In one sentence, explain WHY you are taking the next step."
    )
    return resp.content.strip()


def _react_step(label: str, thought: str, fn, verbose: bool):
    if verbose:
        print(f"\n  [THOUGHT]  {thought}")
        print(f"  [ACTION]   {label}")
    result = fn()
    if verbose:
        print(f"  [OBSERVE]  {result if isinstance(result, str) else 'Action completed.'}")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Tool functions
# ─────────────────────────────────────────────────────────────────────────────

def _simulate_student(lesson: Dict, llm: ChatGroq) -> Dict:
    """Mimics a beginner student attempting the lesson's logic trap question."""
    
    prompt = f"""You are a beginner student learning about '{lesson.get('node_id')}'. 
You have just read this explanation:
{lesson.get('explanation')}

Now, attempt this question:
{lesson.get('logic_trap_question')}

Rules:
- Mimic beginner reasoning.
- You might be swayed by common misconceptions.
- Give ONLY one attempt.

Your output must be a JSON object:
{{
  "answer": "Your chosen answer",
  "is_correct": true/false,
  "reasoning_summary": "Briefly explain why you picked this answer.",
  "confusion_point": "If confused, what specifically is unclear?"
}}
"""
    try:
        response = llm.invoke(prompt)
        content = re.sub(r"```json|```", "", response.content).strip()
        return json.loads(content)
    except Exception:
        return {"answer": "Error", "is_correct": False, "reasoning_summary": "Failed to simulate student.", "confusion_point": "Internal Error"}


def _refine_lesson(lesson: Dict, student_failure: Dict, llm: ChatGroq) -> Dict:
    """Rewrites the weak part of the lesson based on student failure."""
    
    prompt = f"""A student failed a lesson because of this confusion: "{student_failure.get('confusion_point')}".
Reasoning used: "{student_failure.get('reasoning_summary')}"

ORIGINAL LESSON:
Explanation: {lesson.get('explanation')}
Example: {lesson.get('example')}

Rewrite ONLY the weak section (either the explanation OR the example) to address this specific confusion and prevent the misconception.

Your output must be a JSON object:
{{
  "improved_section": "The rewritten explanation or example"
}}
"""
    try:
        response = llm.invoke(prompt)
        content = re.sub(r"```json|```", "", response.content).strip()
        return json.loads(content)
    except Exception:
        return {"improved_section": "Failed to refine lesson."}


# ─────────────────────────────────────────────────────────────────────────────
# Agent runner
# ─────────────────────────────────────────────────────────────────────────────

def run_adaptive_refiner(
    lessons: List[Dict],
    groq_llm: ChatGroq,
    verbose: bool = True
) -> List[Dict]:
    if verbose:
        print("\n  ── ReAct Trace: Agent 7 — Adaptive Refiner ──")

    refined_lessons = []
    
    for lesson in lessons:
        # Step 1: Simulate Student
        thought_sim = _thought(groq_llm, f"Simulating student for lesson {lesson.get('node_id')}") if verbose else ""
        student_result = _react_step(
            label=f"simulate_student ({lesson.get('node_id')})",
            thought=thought_sim,
            fn=lambda l=lesson: _simulate_student(l, groq_llm),
            verbose=verbose
        )
        
        # Step 2: Conditional Refinement
        if not student_result.get('is_correct', True):
            thought_ref = _thought(groq_llm, f"Student failed node {lesson.get('node_id')}. Triggering adaptive refinement.") if verbose else ""
            refinement = _react_step(
                label=f"refine_lesson ({lesson.get('node_id')})",
                thought=thought_ref,
                fn=lambda l=lesson, s=student_result: _refine_lesson(l, s, groq_llm),
                verbose=verbose
            )
            lesson['refined_content'] = refinement.get('improved_section')
            lesson['student_simulation'] = student_result
        else:
            lesson['student_simulation'] = student_result
            lesson['refined_content'] = None
            
        refined_lessons.append(lesson)

    if verbose:
        print(f"\n  ── Agent 7 done. Processed {len(refined_lessons)} lessons. ──")

    return refined_lessons
