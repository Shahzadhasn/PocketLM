from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from starlette.concurrency import run_in_threadpool

from app.database import initialize_database
from app.graph import rag_graph
from app.rag import (
    MAX_FILE_BYTES,
    add_document,
    delete_document,
    list_documents,
)
from app.settings import ALLOWED_ORIGINS


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Local RAG Agent API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if "*" not in ALLOWED_ORIGINS else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=8000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=12)

    @field_validator("question")
    @classmethod
    def question_must_not_be_blank(cls, value: str) -> str:
        question = value.strip()
        if not question:
            raise ValueError("Question must not be blank.")
        return question


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/documents")
def documents() -> list[dict]:
    return list_documents()


@app.post("/api/documents", status_code=201)
async def upload_document(file: UploadFile = File(...)) -> dict:
    name = file.filename or "document"
    if not name.lower().endswith((".pdf", ".txt")):
        raise HTTPException(status_code=415, detail="Only PDF and TXT files are supported.")
    data = await file.read(MAX_FILE_BYTES + 1)
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Files must be 10 MB or smaller.")
    try:
        return await run_in_threadpool(add_document, name, data)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Document indexing failed: {error}") from error


@app.delete("/api/documents/{document_id}", status_code=204)
def remove_document(document_id: str) -> None:
    if not delete_document(document_id):
        raise HTTPException(status_code=404, detail="Document not found.")


@app.post("/api/chat")
def chat(request: ChatRequest) -> dict:
    try:
        result = rag_graph.invoke(
            {
                "question": request.question.strip(),
                "history": [message.model_dump() for message in request.history],
                "sources": [],
                "answer": "",
                "title": "",
            }
        )
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"RAG request failed: {error}") from error
    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "title": result["title"],
    }
