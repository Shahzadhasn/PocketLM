import os

from dotenv import load_dotenv

load_dotenv()


GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
COHERE_EMBED_MODEL = os.getenv(
    "COHERE_EMBED_MODEL", "embed-multilingual-v3.0"
)
DATABASE_PATH = os.getenv("DATABASE_PATH", "data/rag.db")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]
