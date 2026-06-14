# 🎓 Student University Query Management System

> A beginner-friendly RAG project using Python · Streamlit · FAISS · Sentence Transformers · Gemini API

---

## 📁 Folder Structure

```
student_query_system/
│
├── app.py                  ← Main Flask app server (run this)
├── rag_engine.py           ← RAG logic: chunking, embeddings, FAISS search
├── university_info.txt     ← University data (plain text document)
├── requirements.txt        ← All Python packages needed
├── .env                    ← Your secret Gemini API key (never share this)
├── .gitignore              ← Tells Git to ignore .env and cache files
├── templates/
│   └── index.html          ← Frontend HTML page template
└── static/
    ├── css/
    │   └── style.css       ← Premium dark mode styling sheet
    └── js/
        └── main.js         ← Asynchronous frontend client controller
```

---

## 🧠 What is RAG? (Simple Explanation)

**RAG = Retrieval-Augmented Generation**

Imagine you give an AI a textbook and say:
> "When a student asks a question, first search this textbook for the relevant pages, then answer using those pages."

That's exactly RAG! Instead of relying on the AI's general training, you make it answer **from your own documents**.

---

## 🔄 How This Project Works — Step by Step

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  university_info.txt                                        │
│         │                                                   │
│         ▼                                                   │
│  [Step 1] Read the full document                           │
│         │                                                   │
│         ▼                                                   │
│  [Step 2] Split into small chunks (300 words each)         │
│           "Chunk 1: About University..."                    │
│           "Chunk 2: Admission Process..."                   │
│           "Chunk 3: Fee Structure..."   ... etc.            │
│         │                                                   │
│         ▼                                                   │
│  [Step 3] Convert each chunk into a number vector          │
│           (Sentence Transformers does this)                 │
│           Chunk 1 → [0.23, -0.11, 0.87, ...]              │
│           Chunk 2 → [0.55,  0.32, 0.14, ...]              │
│         │                                                   │
│         ▼                                                   │
│  [Step 4] Store all vectors in FAISS index                 │
│           (FAISS = fast search database for vectors)        │
│                                                             │
│  ─────────────── Above steps run ONCE at startup ──────── │
│                                                             │
│  Student types: "What is the hostel entry time?"           │
│         │                                                   │
│         ▼                                                   │
│  [Step 5] Convert question into a vector too               │
│                                                             │
│         ▼                                                   │
│  [Step 6] Search FAISS → find 4 most similar chunks       │
│           Returns: Hostel Rules chunk, Hostel Info chunk... │
│         │                                                   │
│         ▼                                                   │
│  [Step 7] Send to Gemini API:                              │
│           "Here is context: [chunks]. Answer: [question]"  │
│         │                                                   │
│         ▼                                                   │
│  [Step 8] Gemini returns a clear answer                    │
│         │                                                   │
│         ▼                                                   │
│  Display answer in Streamlit UI ✅                         │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Installation — Step by Step

### 1. Make sure Python is installed
```bash
python --version   # Should be 3.9 or higher
```

### 2. Create and activate a virtual environment (recommended)
```bash
# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Activate it (Mac/Linux)
source venv/bin/activate
```

### 3. Install all required packages
```bash
pip install -r requirements.txt
```
> ⚠️ This will download ~500MB (sentence transformer model). Do this on a good internet connection.

### 4. Get your FREE Gemini API key
- Go to: https://aistudio.google.com/app/apikey
- Click **"Create API Key"**
- Copy the key

### 5. Set up the `.env` file
Open the `.env` file and replace the placeholder:
```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX   ← paste your key here
```

### 6. Run the app
```bash
python app.py
```

Open your browser and navigate to `http://127.0.0.1:5000` to interact with the system.

---

## 🧪 Sample Questions to Try

| Question | Expected Topic |
|---|---|
| What is the last date for admission? | Admissions |
| How much is the B.Tech fee per year? | Fee Structure |
| When are the end semester exams? | Exam Schedule |
| What are the hostel rules? | Hostel |
| What are the library timings on Sunday? | Library |
| How can I apply for a scholarship? | Scholarship |
| What is the placement percentage? | Placement |
| What CGPA is required for placement? | Placement |
| What documents are needed for admission? | Admissions |

---

## 🛠️ Technology Stack Explained

| Technology | What it does in this project |
|---|---|
| **Python** | Main programming language |
| **Flask** | Backend micro-framework serving the web interface and API endpoints |
| **HTML5 & Vanilla CSS3** | Rich, modern responsive dark interface with animations |
| **JavaScript** | Handles form submissions, API loading states, and animations |
| **Sentence Transformers** | Converts text into numeric vectors (embeddings) |
| **FAISS** | Stores vectors and searches them quickly |
| **Gemini API** | Google's AI that generates the final answer |
| **python-dotenv** | Reads the API key from `.env` file securely |

---

## 📖 File-by-File Explanation (For Faculty Demo)

### `university_info.txt`
Plain text file with all university information. You can edit this to add real university data.

### `rag_engine.py`
Contains 4 simple functions:
- `load_and_chunk()` — reads file and splits into pieces
- `get_embeddings()` — converts text to numbers
- `build_faiss_index()` — builds a searchable database
- `search_chunks()` — finds the most relevant pieces for a question

### `app.py`
The Flask web application server:
- Loads and indexes the document at startup once.
- Serves the frontend at the root route `/`.
- Processes queries asynchronously via the `/api/query` route.

### `templates/index.html` & `static/`
The frontend client interface:
- High-fidelity dark mode styling with smooth CSS layouts.
- Interactive JS controller for AJAX requests, loaders, and accordion expanders.

---

## 📌 Key Concepts for Faculty Presentation

1. **Chunking** — Why? LLMs have a token limit. We can't send a 10-page doc all at once, so we break it into pieces.

2. **Embeddings** — Converting words to numbers captures their *meaning*, not just the letters. "fee" and "cost" will have similar vectors.

3. **FAISS** — Like a fast search engine, but for meaning. Google searches by keywords; FAISS searches by concept.

4. **Grounding** — By giving Gemini only the relevant chunks, we prevent hallucination (making up wrong answers).

---

## 🚀 Possible Extensions (Future Work)
- Upload multiple PDFs through the UI
- Add conversation history (chat mode)
- Support multiple departments with different documents
- Add a feedback button (thumbs up/down)
- Show confidence score of the retrieved chunks

---

## 🌐 Deployment & Production Configuration

This project is fully configured for production deployment using standard cloud hosting services (e.g. Render, AWS, Google Cloud, Fly.io, etc.) either via native Python runtimes or Docker containers.

### ⚡ Deployment Optimizations

1. **Build-Time Model Caching**: The SentenceTransformer model (`all-MiniLM-L6-v2`) is downloaded and saved locally into the `models/` directory during the build phase (via `download_model.py`). This prevents startup delays, reduces cold-start times, and guards against Hugging Face rate limits or network issues at runtime.
2. **Health Check Endpoint**: A `/health` route is available. It returns `200 OK` (when the FAISS indexing is complete and the system is ready) or `503 Service Unavailable` (while the index is still building). Cloud platforms use this endpoint for readiness checks to ensure zero-downtime deployments.
3. **Structured Logging**: Standard Python logging is configured for all backend logic, printing structured logs with timestamps and severity levels to `stdout` for compatibility with cloud logging solutions.

---

### 🐳 Option A: Deploying with Docker

A production-optimized `Dockerfile` is provided in the repository root. It installs the GNU OpenMP library (`libgomp1`), which is required by `faiss-cpu` to prevent container runtime errors.

#### Build the image locally
```bash
docker build -t student-query-system .
```

#### Run the container locally
```bash
docker run -p 10000:10000 -e GEMINI_API_KEY="your-gemini-api-key" student-query-system
```
Access the application at `http://localhost:10000`.

---

### ☁️ Option B: Deploying on Render (via Blueprint)

The project includes a `render.yaml` blueprint configuration that provisions the application using Render's Native Python environment.

#### Required Environment Variables

Configure the following environment variables in the Render dashboard:

| Variable | Value | Description |
|---|---|---|
| `GEMINI_API_KEY` | `AIzaSy...` | Your secret Google Gemini API key. |

*Note: The `PORT` variable is automatically managed by Render (defaults to `10000` in our blueprint).*

#### Steps to Deploy
1. Push this project to your GitHub or GitLab repository.
2. In the Render Dashboard, click **New** → **Blueprint**.
3. Connect your repository. Render automatically reads `render.yaml` and deploys the service:
   - **Build Command**: `pip install -r requirements.txt && python download_model.py` (caching the model at build-time)
   - **Start Command**: `gunicorn app:app --workers 1 --timeout 120`
4. Enter your `GEMINI_API_KEY` and click **Deploy**.

#### Render Free Tier Notes
- **Memory Limit (512MB)**: To stay within free tier memory limits, Gunicorn is restricted to `--workers 1`.
- **Pre-loaded Model**: Caching the model during the build phase ensures startup is extremely fast, avoiding the 120-second timeout Render imposes on web server boot.

