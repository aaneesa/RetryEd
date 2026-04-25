# RetryEd 🧠📚

**An Algorithmic Instructional Designer & Multi-Agent Curriculum Engine**

RetryEd is a highly advanced, multi-agent AI system designed to ingest raw pedagogical materials (like PDFs) and autonomously synthesize robust, structured, and adaptively refined academic curricula. It features a completely dynamic React frontend mimicking an advanced "AI thought-process" interface.

## 🌟 Features

### Multi-Agent Pipeline
The backend is driven by a 7-stage sequential ReAct AI pipeline powered by **Groq (Llama-3.1)** and **Google Gemini**:
1. **Miner**: Extracts atomic learning units (ALUs) from raw text.
2. **Graph Builder**: Connects ALUs into a prerequisite dependency graph.
3. **Cognitive Scorer**: Evaluates the cognitive depth of each concept.
4. **Curriculum Engine**: Applies Kahn's & Gagné's principles to optimally order lessons.
5. **Lesson Generator (Core)**: Drafts high-quality lessons, hooks, explanations, and logic-trap questions.
6. **Weak Spot Tracker**: Programmatically flags complex, high-failure concepts.
7. **Adaptive Refiner (Student Simulator)**: Runs a simulated student through the logic-trap quizzes. If the student fails, it actively refines and rewrites the core explanation to prevent misconceptions.

### Advanced "Zen" User Interface
Built with **Vite**, **React**, and **Framer Motion**, the frontend abandons standard chat UI in favor of a guided, high-end "Workbench" experience:
- **Mode Selection**: Choose between "Concept Exploration (Mindmaps)" or "Curriculum Generation".
- **Typewriter Flow**: Input curriculum parameters (Audience, Lectures, Style) via rapid pill-button selection.
- **Simulation Feed**: Watch the Student Agent simulate taking quizzes and triggering Adaptive Refinement in real time.
- **Document Reveal**: Outputs are not treated as chat messages, but rendered as beautiful off-white, serif-typography academic documents that can be instantly downloaded as PDF.
- **Native Mindmaps**: Renders architectural concept graphs securely using `mermaid.js`.

### Robust Persistence
- Integrated with **MongoDB Atlas** using `pymongo[srv]`.
- All generated outputs (Mermaid Mindmaps and structured Lecture Deliverables) are automatically persisted.

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js & npm
- MongoDB Atlas Cluster
- API Keys for **Groq** and **Google Gemini**

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_key_here
GOOGLE_API_KEY=your_gemini_key_here
MONGO_URI=mongodb+srv://<username>:<password>@cluster0...
```

### 2. Backend Setup
Install Python dependencies and start the FastAPI server:
```bash
# Install dependencies
pip install -r requirements.txt
pip install fastapi uvicorn python-multipart pdfplumber

# Start the API server
uvicorn api:app --reload --port 8000
```

### 3. Frontend Setup
In a new terminal tab, run the Vite React app:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## 🏗️ Architecture Stack
- **AI/LLM**: `langchain-groq`, `langchain-google-genai`
- **Backend API**: `FastAPI`, `Uvicorn`
- **Data Ingestion**: `pdfplumber`
- **Database**: `MongoDB`, `pymongo`
- **Frontend**: `React 18`, `Vite`, `Framer Motion`, `Lucide React`, `Mermaid.js`

## 📝 License
This project is proprietary and built for Operon AI/RetryEd. All rights reserved.
