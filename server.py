"""
Flask API Server for RetryEd
Wraps the existing pipeline and exposes REST endpoints for the React frontend.
"""

import os
import json
import traceback
import threading
import uuid
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# In-memory store for pipeline progress/results keyed by session_id
sessions = {}
session_lock = threading.Lock()


def get_session(session_id):
    with session_lock:
        return sessions.get(session_id, {})


def update_session(session_id, data):
    with session_lock:
        if session_id not in sessions:
            sessions[session_id] = {}
        sessions[session_id].update(data)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})


@app.route("/api/upload", methods=["POST"])
def upload_file():
    """Handle PDF upload and extract text."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    session_id = str(uuid.uuid4())

    try:
        import pdfplumber
        # Save temporarily
        tmp_path = os.path.join("/tmp", f"{session_id}.pdf")
        file.save(tmp_path)

        with pdfplumber.open(tmp_path) as pdf:
            raw_text = "\n".join(p.extract_text() or "" for p in pdf.pages)

        os.remove(tmp_path)

        update_session(session_id, {
            "raw_text": raw_text,
            "filename": file.filename,
            "status": "text_extracted",
            "events": [],
        })

        return jsonify({
            "session_id": session_id,
            "filename": file.filename,
            "text_length": len(raw_text),
            "preview": raw_text[:500],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/text", methods=["POST"])
def submit_text():
    """Handle direct text input."""
    data = request.json
    raw_text = data.get("text", "").strip()
    if not raw_text:
        return jsonify({"error": "No text provided"}), 400

    session_id = str(uuid.uuid4())
    update_session(session_id, {
        "raw_text": raw_text,
        "filename": "Direct Input",
        "status": "text_extracted",
        "events": [],
    })

    return jsonify({
        "session_id": session_id,
        "filename": "Direct Input",
        "text_length": len(raw_text),
        "preview": raw_text[:500],
    })


@app.route("/api/mindmap/<session_id>", methods=["POST"])
def generate_mindmap_endpoint(session_id):
    """Generate mindmap for a session."""
    session = get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    raw_text = session.get("raw_text", "")
    if not raw_text:
        return jsonify({"error": "No text in session"}), 400

    update_session(session_id, {"status": "generating_mindmap"})

    try:
        from src.agents.agent0_mindmap_generator import generate_mindmap

        google_key = os.getenv("GOOGLE_API_KEY")
        if not google_key:
            return jsonify({"error": "GOOGLE_API_KEY not configured"}), 500

        mermaid_code = generate_mindmap(
            raw_text=raw_text,
            api_key=google_key,
            verbose=False,
        )

        # Try saving to DB
        db_id = None
        try:
            from src.core.database import DatabaseManager
            db = DatabaseManager()
            db_id = db.save_mindmap(mermaid_code=mermaid_code, raw_text=raw_text, topic="Mindmap Generation")
        except Exception:
            pass

        update_session(session_id, {
            "status": "mindmap_complete",
            "mermaid_code": mermaid_code,
            "db_id": db_id,
        })

        return jsonify({
            "mermaid_code": mermaid_code,
            "db_id": db_id,
        })

    except Exception as e:
        update_session(session_id, {"status": "error", "error": str(e)})
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


def _run_pipeline_async(session_id, raw_text):
    """Run the full curriculum pipeline in background thread."""
    try:
        from langchain_groq import ChatGroq
        from src.agents.agent1_miner import run_miner
        from src.agents.agent2_graph_builder import run_graph_builder
        from src.agents.agent3_cognitive_scorer import run_cognitive_scorer
        from src.agents.agent4_curriculum_engine import run_curriculum_engine
        from src.agents.agent5_lesson_generator import run_lesson_generator
        from src.agents.agent6_weak_spot_tracker import run_weak_spot_tracker
        from src.agents.agent7_adaptive_refiner import run_adaptive_refiner

        groq_key = os.getenv("GROQ_API_KEY")
        groq_llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=groq_key,
            temperature=0,
        )

        def add_event(title, description, status="complete", score=None):
            session = get_session(session_id)
            events = session.get("events", [])
            events.append({
                "id": len(events) + 1,
                "title": title,
                "description": description,
                "status": status,
                "score": score,
                "timestamp": datetime.utcnow().isoformat(),
            })
            update_session(session_id, {"events": events})

        # Agent 1 — Miner
        update_session(session_id, {"status": "agent_1_running", "current_agent": "Miner (Concept Extractor)"})
        add_event("Agent 1 — Miner", "Extracting concepts from document...", "running")
        miner_output = run_miner(raw_text=raw_text, groq_llm=groq_llm, verbose=False)
        add_event("Agent 1 — Miner", f"Extracted {len(miner_output)} Atomic Learning Units (ALUs)", "complete")

        # Agent 2 — Graph Builder
        update_session(session_id, {"status": "agent_2_running", "current_agent": "Graph Builder"})
        add_event("Agent 2 — Graph Builder", "Building prerequisite dependency graph...", "running")
        graph_nodes = run_graph_builder(miner_output=miner_output, groq_llm=groq_llm, verbose=False)
        add_event("Agent 2 — Graph Builder", f"Built DAG with {len(graph_nodes)} nodes", "complete")

        # Agent 3 — Cognitive Scorer
        update_session(session_id, {"status": "agent_3_running", "current_agent": "Cognitive Scorer"})
        add_event("Agent 3 — Cognitive Scorer", "Scoring abstraction & uncertainty levels...", "running")
        scorer_output = run_cognitive_scorer(
            graph_nodes=graph_nodes, miner_output=miner_output,
            groq_llm=groq_llm, verbose=False,
        )
        add_event("Agent 3 — Cognitive Scorer", f"Scored {len(scorer_output)} concepts", "complete", score="3/10")

        # Agent 4 — Curriculum Engine
        update_session(session_id, {"status": "agent_4_running", "current_agent": "Curriculum Engine"})
        add_event("Agent 4 — Curriculum Engine", "Topological sort with Gagné alignment...", "running")
        curriculum = run_curriculum_engine(
            graph_nodes=graph_nodes, scorer_output=scorer_output,
            miner_output=miner_output, groq_llm=groq_llm, verbose=False,
        )
        add_event("Agent 4 — Curriculum Engine", f"Ordered {len(curriculum)} lessons using Kahn's algorithm", "complete", score="5/10")

        # Agent 5 — Lesson Generator
        update_session(session_id, {"status": "agent_5_running", "current_agent": "Lesson Generator"})
        add_event("Agent 5 — Lesson Generator", "Generating pedagogical lesson content...", "running")
        lessons = run_lesson_generator(curriculum=curriculum, groq_llm=groq_llm, verbose=False)
        add_event("Agent 5 — Lesson Generator", f"Generated {len(lessons)} detailed lessons", "complete", score="6/10")

        # Agent 6 — Weak Spot Tracker
        update_session(session_id, {"status": "agent_6_running", "current_agent": "Weak Spot Tracker"})
        add_event("Agent 6 — Weak Spot Tracker", "Identifying high-risk failure points...", "running")
        weak_spots = run_weak_spot_tracker(scorer_output=scorer_output, verbose=False)
        add_event("Agent 6 — Weak Spot Tracker", f"Flagged {len(weak_spots)} potential failure points", "complete", score="7/10")

        # Agent 7 — Adaptive Refiner
        update_session(session_id, {"status": "agent_7_running", "current_agent": "Adaptive Refiner"})
        add_event("Agent 7 — Adaptive Refiner", "Simulating student & refining lessons...", "running")
        final_curriculum = run_adaptive_refiner(lessons=lessons, groq_llm=groq_llm, verbose=False)
        refined_count = sum(1 for l in final_curriculum if l.get("refined_content"))
        add_event("Agent 7 — Adaptive Refiner", f"Refined {refined_count}/{len(final_curriculum)} lessons after simulation", "complete", score="9/10")

        # Merge curriculum data with lesson data for complete output
        curriculum_map = {c["id"]: c for c in curriculum}
        full_results = []
        for lesson in final_curriculum:
            node_id = lesson.get("node_id", "")
            cur_data = curriculum_map.get(node_id, {})
            full_results.append({
                **cur_data,
                **lesson,
            })

        results = {
            "curriculum": full_results,
            "weak_spots": weak_spots,
            "stats": {
                "total_concepts": len(miner_output),
                "total_nodes": len(graph_nodes),
                "total_lessons": len(final_curriculum),
                "refined_lessons": refined_count,
                "weak_spots_count": len(weak_spots),
            }
        }

        # Try saving to DB
        db_id = None
        try:
            from src.core.database import DatabaseManager
            db = DatabaseManager()
            db_id = db.save_lecture_deliverable(curriculum_data=results, topic="Curriculum Generation")
        except Exception:
            pass

        update_session(session_id, {
            "status": "complete",
            "results": results,
            "db_id": db_id,
            "current_agent": None,
        })

    except Exception as e:
        update_session(session_id, {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc(),
            "current_agent": None,
        })


@app.route("/api/curriculum/<session_id>", methods=["POST"])
def start_curriculum(session_id):
    """Start the curriculum pipeline (async)."""
    session = get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    raw_text = session.get("raw_text", "")
    if not raw_text:
        return jsonify({"error": "No text in session"}), 400

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        return jsonify({"error": "GROQ_API_KEY not configured"}), 500

    update_session(session_id, {"status": "pipeline_starting", "events": []})

    thread = threading.Thread(target=_run_pipeline_async, args=(session_id, raw_text))
    thread.daemon = True
    thread.start()

    return jsonify({"message": "Pipeline started", "session_id": session_id})


@app.route("/api/status/<session_id>", methods=["GET"])
def get_status(session_id):
    """Get pipeline status and events."""
    session = get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({
        "status": session.get("status"),
        "current_agent": session.get("current_agent"),
        "events": session.get("events", []),
        "filename": session.get("filename"),
    })


@app.route("/api/results/<session_id>", methods=["GET"])
def get_results(session_id):
    """Get final pipeline results."""
    session = get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    if session.get("status") != "complete":
        return jsonify({"error": "Pipeline not complete", "status": session.get("status")}), 400

    return jsonify(session.get("results", {}))


if __name__ == "__main__":
    app.run(debug=True, port=5001)
