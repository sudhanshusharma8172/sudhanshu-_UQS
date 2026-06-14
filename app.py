"""
Student University Query Management System
=========================================
Flask Backend: Serves HTML templates and processes RAG query requests via JSON API.
Uses RAG (Retrieval-Augmented Generation) to answer student questions
from university documents using FAISS + Sentence Transformers + Gemini API.
"""

import os
import logging
from pathlib import Path

from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from rag_engine import build_index, search_chunks
import google.generativeai as genai

# Configure production logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent

# ── Load environment variables from .env file ──────────────────────────────
load_dotenv(BASE_DIR / ".env")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ── Configure Gemini ───────────────────────────────────────────────────────
model = None
if GEMINI_API_KEY:
    logger.info("GEMINI_API_KEY loaded. Configuring GenerativeAI model...")
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
else:
    logger.warning("GEMINI_API_KEY is missing. Generative AI queries will fail.")

# ── Initialize Flask App ───────────────────────────────────────────────────
app = Flask(__name__)

# ── Load and Build Index at Startup ────────────────────────────────────────
chunks = []
index = None
embed_model = None

def load_knowledge_index():
    """Load the university doc and build FAISS vector index."""
    global chunks, index, embed_model
    try:
        data_path = BASE_DIR / "university_info.txt"
        if not data_path.exists():
            logger.error(f"CRITICAL: {data_path} not found.")
            return False
        
        chunks, index, embed_model = build_index(str(data_path))
        logger.info("Knowledge base index loaded and built successfully!")
        return True
    except Exception as e:
        logger.error(f"CRITICAL: Failed to build knowledge base index: {e}")
        return False

# ── Routes ─────────────────────────────────────────────────────────────────

@app.route("/health")
def health_route():
    """Health check endpoint for deployment monitoring."""
    if not chunks or not index or not embed_model:
        return jsonify({"status": "initializing", "message": "Knowledge base index is still building."}), 503
    if not GEMINI_API_KEY:
        return jsonify({"status": "degraded", "message": "GEMINI_API_KEY is missing."}), 200
    return jsonify({"status": "healthy"}), 200

@app.route("/")
def index_route():
    """Serve the main student search interface."""
    return render_template("index.html")

@app.route("/api/query", methods=["POST"])
def query_route():
    """
    Handle AJAX POST requests from the client.
    Expects JSON payload: { "question": "..." }
    """
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY environment variable is not configured on the server."}), 500

    # Parse request JSON data
    data = request.get_json() or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Please type a question first."}), 400

    # Ensure index has been loaded
    if not chunks or not index or not embed_model:
        return jsonify({
            "error": "Knowledge index not initialized. Make sure university_info.txt exists in the project root."
        }), 500

    try:
        # Step 1 — Retrieve relevant chunks from FAISS
        relevant_chunks = search_chunks(question, chunks, index, embed_model, top_k=4)
        context = "\n\n".join(relevant_chunks)

        # Step 2 — Ask Gemini with context
        if not model:
            return jsonify({"error": "Gemini model configuration failed. Check API key."}), 500

        prompt = f"""You are a helpful university assistant.
Use ONLY the context below to answer the student's question.
If the answer is not in the context, say: "I don't have that information in the university documents."

Context:
{context}

Student Question: {question}

Answer in simple, clear language suitable for a student."""

        response = model.generate_content(prompt)
        answer = response.text

        return jsonify({
            "question": question,
            "answer": answer,
            "chunks": relevant_chunks
        })
    except Exception as e:
        return jsonify({"error": f"An error occurred during query execution: {str(e)}"}), 500

# Build the RAG index once on startup/import (works for both local debug and Gunicorn)
load_knowledge_index()

# ── Main Entrypoint ────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Get port from environment variable (default to 5000 for local development)
    port = int(os.environ.get("PORT", 5000))
    # debug=False for production safety; set to True only for local development
    app.run(host="0.0.0.0", port=port, debug=False)
