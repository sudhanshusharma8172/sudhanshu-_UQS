# ── Base image ────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# ── System dependencies ────────────────────────────────────────────────────────
# libgomp1 is REQUIRED by faiss-cpu (GNU OpenMP library)
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ──────────────────────────────────────────────────────────
WORKDIR /app

# ── Install Python packages (cached layer) ─────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Pre-download ML model at BUILD TIME (avoids 120s startup timeout) ──────────
COPY download_model.py .
RUN python download_model.py

# ── Copy remaining app files ───────────────────────────────────────────────────
COPY . .

# ── Expose port ────────────────────────────────────────────────────────────────
EXPOSE 10000

# ── Start server ───────────────────────────────────────────────────────────────
# Uses $PORT from Render env; falls back to 10000
CMD gunicorn app:app --bind 0.0.0.0:${PORT:-10000} --workers 1 --timeout 120
