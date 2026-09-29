# ── Base image ────────────────────────────────────────────────────────────────
# Using slim variant for smaller image size on Render free tier
FROM python:3.11-slim

# ── Install system dependencies ────────────────────────────────────────────────
# libgomp1 is required by faiss-cpu (GNU OpenMP library for multi-threading)
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ── Set working directory ──────────────────────────────────────────────────────
WORKDIR /app

# ── Install Python dependencies first (leverages Docker layer caching) ─────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Pre-download and cache the SentenceTransformer model at BUILD TIME ─────────
# This avoids downloading at startup (prevents 120s timeout on Render)
COPY download_model.py .
RUN python download_model.py

# ── Copy the rest of the application code ─────────────────────────────────────
COPY . .

# ── Expose the port Render will bind to ───────────────────────────────────────
EXPOSE 10000

# ── Start the application with Gunicorn ───────────────────────────────────────
# --workers 1     → stay within Render free tier 512MB RAM limit
# --timeout 120   → allow 2 minutes for first request (cold start)
# --bind 0.0.0.0  → listen on all interfaces
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000", "--workers", "1", "--timeout", "120"]
