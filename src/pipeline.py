"""
Pipeline Runner
Wires Agent 1 → 2 → 3 → 4 using a shared state store and ChatGroq.

Usage:
    python -m src.pipeline --pdf path/to/doc.pdf --groq-key YOUR_KEY
    python -m src.pipeline --text "Raw text..." --groq-key YOUR_KEY

Output:
    curriculum.json  — ordered list of lessons with Gagné events
"""

import argparse
import json
import os
import sys

from langchain_groq import ChatGroq

from src.core import state_store
from src.core.database import DatabaseManager
from src.agents.agent0_mindmap_generator import generate_mindmap
from src.agents.agent1_miner            import run_miner
from src.agents.agent2_graph_builder    import run_graph_builder
from src.agents.agent3_cognitive_scorer import run_cognitive_scorer
from src.agents.agent4_curriculum_engine import run_curriculum_engine
from src.agents.agent5_lesson_generator import run_lesson_generator
from src.agents.agent6_weak_spot_tracker import run_weak_spot_tracker
from src.agents.agent7_adaptive_refiner import run_adaptive_refiner


def load_text(args) -> str:
    if args.text:
        return args.text
    if args.pdf:
        try:
            import pdfplumber
            with pdfplumber.open(args.pdf) as pdf:
                return "\n".join(p.extract_text() or "" for p in pdf.pages)
        except ImportError:
            print("[WARN] pdfplumber not installed. Install with: pip install pdfplumber")
            sys.exit(1)
    print("[ERROR] Provide --text or --pdf")
    sys.exit(1)


def run_pipeline(raw_text: str, groq_api_key: str, model: str, verbose: bool) -> dict:
    groq_llm = ChatGroq(
        model=model,
        api_key=groq_api_key,
        temperature=0,
    )

    print("\n" + "="*60)
    print("  AGENT 1 — Miner (Concept Extractor)")
    print("="*60)
    miner_output = run_miner(
        raw_text=raw_text,
        groq_llm=groq_llm,
        verbose=verbose,
    )
    print(f"\n✅ Agent 1 done — {len(miner_output)} ALUs extracted.\n")

    print("="*60)
    print("  AGENT 2 — Graph Builder + Depth Engine")
    print("="*60)
    graph_nodes = run_graph_builder(
        miner_output=miner_output,
        groq_llm=groq_llm,
        verbose=verbose
    )
    print(f"\n✅ Agent 2 done — {len(graph_nodes)} graph nodes built.\n")

    print("="*60)
    print("  AGENT 3 — Cognitive Scorer (Batched Groq LLM)")
    print("="*60)
    scorer_output = run_cognitive_scorer(
        graph_nodes=graph_nodes,
        miner_output=miner_output,
        groq_llm=groq_llm,
        verbose=verbose
    )
    print(f"\n✅ Agent 3 done — {len(scorer_output)} nodes scored.\n")

    print("="*60)
    print("  AGENT 4 — Curriculum Engine (Kahn's + Gagné)")
    print("="*60)
    curriculum = run_curriculum_engine(
        graph_nodes=graph_nodes,
        scorer_output=scorer_output,
        miner_output=miner_output,
        groq_llm=groq_llm,
        verbose=verbose
    )
    print(f"\n✅ Agent 4 done — {len(curriculum)} lessons ordered.\n")

    print("="*60)
    print("  AGENT 5 — Lesson Generator (CORE)")
    print("="*60)
    lessons = run_lesson_generator(
        curriculum=curriculum,
        groq_llm=groq_llm,
        verbose=verbose
    )
    print(f"\n✅ Agent 5 done — {len(lessons)} core lessons generated.\n")

    print("="*60)
    print("  AGENT 6 — Weak Spot Tracker (Non-LLM)")
    print("="*60)
    weak_spots = run_weak_spot_tracker(
        scorer_output=scorer_output,
        verbose=verbose
    )
    print(f"\n✅ Agent 6 done — {len(weak_spots)} potential failure points identified.\n")

    print("="*60)
    print("  AGENT 7 — Adaptive Refiner (Simulated Student)")
    print("="*60)
    final_curriculum = run_adaptive_refiner(
        lessons=lessons,
        groq_llm=groq_llm,
        verbose=verbose
    )
    print(f"\n✅ Agent 7 done — Adaptive refinement complete.\n")

    return {
        "curriculum": final_curriculum,
        "weak_spots": weak_spots
    }


def main():
    parser = argparse.ArgumentParser(description="Algorithmic Instructional Designer Pipeline")
    parser.add_argument("--pdf",      type=str, help="Path to PDF file")
    parser.add_argument("--text",     type=str, help="Raw text input (alternative to PDF)")
    parser.add_argument("--groq-key", type=str, default=os.getenv("GROQ_API_KEY"), help="Groq API key")
    parser.add_argument("--google-key", type=str, default=os.getenv("GOOGLE_API_KEY"), help="Google API key for Gemini")
    parser.add_argument("--model",    type=str, default="llama-3.1-8b-instant", help="Groq model name")
    parser.add_argument("--output",   type=str, default="curriculum.json", help="Output JSON file")
    parser.add_argument("--quiet",    action="store_true", help="Suppress agent traces")
    parser.add_argument("--mode",     type=str, choices=["mindmap", "curriculum", "both"], default=None, help="Choose mode")
    args = parser.parse_args()

    # Initialize Database Manager
    db = None
    try:
        db = DatabaseManager()
    except Exception as e:
        print(f"[WARN] Database not configured or unavailable: {e}. Generations will not be stored in MongoDB.")

    raw_text = load_text(args)

    # Initial Choice
    mode = args.mode
    if not mode:
        print("\nWelcome to RetryEd! How would you like to proceed?")
        print("1. Revise Concepts using Mindmaps (Gemini)")
        print("2. Directly jump to Curriculum building (Groq)")
        choice = input("\nEnter choice (1 or 2): ").strip()
        mode = "mindmap" if choice == "1" else "curriculum"

    if mode == "mindmap":
        if not args.google_key:
            print("[ERROR] Provide --google-key or set GOOGLE_API_KEY env var for Mindmap generation")
            sys.exit(1)
        
        mermaid_code = generate_mindmap(
            raw_text=raw_text,
            api_key=args.google_key,
            verbose=not args.quiet
        )
        print("\n" + "="*60)
        print("  GENERATED MINDMAP (Mermaid)")
        print("="*60)
        print(mermaid_code)
        print("="*60)
        
        with open("mindmap.mmd", "w") as f:
            f.write(mermaid_code)
        print("\n✅ Mindmap saved to mindmap.mmd. Use a Mermaid viewer to see it.")
        
        if db:
            db_id = db.save_mindmap(mermaid_code=mermaid_code, raw_text=raw_text, topic="Mindmap Generation")
            print(f"✅ Mindmap stored in MongoDB (ID: {db_id})")
        
        # Optionally continue to curriculum
        cont = input("\nWould you like to continue to Curriculum building? (y/n): ").lower().strip()
        if cont != 'y':
            sys.exit(0)

    # Run Curriculum Pipeline
    if not args.groq_key:
        print("[ERROR] Provide --groq-key or set GROQ_API_KEY env var")
        sys.exit(1)

    results = run_pipeline(
        raw_text=raw_text,
        groq_api_key=args.groq_key,
        model=args.model,
        verbose=not args.quiet,
    )

    with open(args.output, "w") as f:
        json.dump(results, f, indent=2, default=str)

    if db:
        db_id = db.save_lecture_deliverable(curriculum_data=results, topic="Curriculum Generation")
        print(f"\n✅ Curriculum stored in MongoDB (ID: {db_id})")

    curriculum = results['curriculum']
    print(f"\n📄 Full pedagogical data saved → {args.output}")
    print(f"   Total Lessons: {len(curriculum)}")
    print(f"   Weak Spots Identified: {len(results['weak_spots'])}")
    
    print("\nFirst 5 lessons summary:")
    for lesson in curriculum[:5]:
        status = "✅ Refined" if lesson.get('refined_content') else "✨ Original"
        print(f"  {lesson['rank']:>2}. [{status}] {lesson['concept_title']} (Pn={lesson['Pn']:.2f})")


if __name__ == "__main__":
    main()
