# RAG backend

## Setup

1. Use Python 3.11 or newer and create/activate a virtual environment.
2. From this directory, install dependencies: `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and set `GROQ_API_KEY` and `COHERE_API_KEY`.
   Keys are only used by this backend; do not put them in the mobile app.
4. Start the API: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.

The SQLite database is created at `data/rag.db` by default. PDF and UTF-8 TXT
files up to 10 MB are split, embedded with Cohere, and stored in SQLite. PDF
text is extracted with PyMuPDF; image-only scanned PDFs require OCR and are not
currently supported. Chat uses the configured Groq model through a LangGraph
retrieval/generation graph.
The defaults are `openai/gpt-oss-20b` and Cohere `embed-multilingual-v3.0`.
Model access and quotas depend on your provider accounts and can change; model
names can be changed in `.env`. Re-upload documents after changing the
embedding model so stored document vectors and query vectors stay compatible.

The API is intended for local development. Before exposing it publicly, add
authentication, rate limiting, and stricter CORS configuration.
