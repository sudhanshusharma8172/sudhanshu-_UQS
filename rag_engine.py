"""
rag_engine.py
=============
Core RAG logic:
  1. Load text from university_info.txt
  2. Split into small chunks
  3. Convert chunks into embeddings using Sentence Transformers
  4. Store embeddings in a FAISS index
  5. Given a query, find the most relevant chunks
"""

import os
import logging
from pathlib import Path

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


# ── Step 1 & 2: Load and chunk the document ────────────────────────────────

def load_and_chunk(filepath: str | Path, chunk_size: int = 300, overlap: int = 50) -> list[str]:
    """
    Read the text file and split it into overlapping chunks.

    chunk_size : number of words per chunk
    overlap    : how many words from the previous chunk to carry over
                 (overlap helps preserve context at chunk boundaries)
    """
    path = Path(filepath)
    with path.open("r", encoding="utf-8") as f:
        text = f.read()

    words = text.split()          # split entire text by whitespace
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])   # join words back into a string
        chunks.append(chunk)
        start += chunk_size - overlap        # move forward but keep 'overlap' words

    return chunks


# ── Step 3: Create embeddings ──────────────────────────────────────────────

def get_embeddings(chunks: list[str], model: SentenceTransformer) -> np.ndarray:
    """
    Convert each chunk into a numeric vector (embedding).
    These vectors capture the *meaning* of each chunk.
    """
    # encode() returns a 2D numpy array of shape (num_chunks, embedding_dim)
    embeddings = model.encode(chunks, show_progress_bar=False)
    return np.array(embeddings, dtype="float32")


# ── Step 4: Build FAISS index ──────────────────────────────────────────────

def build_faiss_index(embeddings: np.ndarray) -> faiss.IndexFlatL2:
    """
    Store all chunk embeddings in a FAISS index for fast nearest-neighbor search.
    IndexFlatL2 = exact search using Euclidean distance (fine for small datasets).
    """
    dim = embeddings.shape[1]              # number of dimensions in each vector
    index = faiss.IndexFlatL2(dim)         # create a FAISS index
    index.add(embeddings)                  # add all embeddings to the index
    return index


# ── Combined: build everything at once ────────────────────────────────────

def build_index(filepath: str | Path):
    """
    Full pipeline:
      Load file → chunk → embed → FAISS index
    Returns (chunks, faiss_index, embed_model) so the app can reuse them.
    """
    base_dir = Path(__file__).resolve().parent
    local_model_path = base_dir / "models" / "all-MiniLM-L6-v2"

    if local_model_path.exists() and any(local_model_path.iterdir()):
        logger.info("Loading sentence transformer model from local cache...")
        embed_model = SentenceTransformer(str(local_model_path))
    else:
        logger.info("Local model cache not found. Loading sentence transformer model from online HuggingFace Hub...")
        embed_model = SentenceTransformer("all-MiniLM-L6-v2")

    logger.info("Loading and chunking document...")
    chunks = load_and_chunk(filepath)

    logger.info(f"  → {len(chunks)} chunks created")

    logger.info("Generating embeddings...")
    embeddings = get_embeddings(chunks, embed_model)

    logger.info("Building FAISS index...")
    index = build_faiss_index(embeddings)

    logger.info("Index ready!")
    return chunks, index, embed_model


# ── Step 5: Search relevant chunks ────────────────────────────────────────

def search_chunks(query: str, chunks: list[str], index: faiss.IndexFlatL2,
                  embed_model: SentenceTransformer, top_k: int = 4) -> list[str]:
    """
    Given a student question:
      1. Embed the question into a vector
      2. Search FAISS for the top_k most similar chunk vectors
      3. Return those chunks as context for Gemini
    """
    # Embed the question (same model, same vector space as the chunks)
    query_vec = embed_model.encode([query], show_progress_bar=False)
    query_vec = np.array(query_vec, dtype="float32")

    # Search: returns distances and indices of the closest chunks
    distances, indices = index.search(query_vec, top_k)

    # Retrieve the actual text of those chunks
    results = [chunks[i] for i in indices[0] if i < len(chunks)]
    return results
