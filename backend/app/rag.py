import json
import math
import re
import uuid
from pathlib import Path

import cohere
import pymupdf
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.database import connect
from app.settings import COHERE_API_KEY, COHERE_EMBED_MODEL

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_CHUNKS_PER_DOCUMENT = 500
_splitter = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=120)


def _client() -> cohere.Client:
    if not COHERE_API_KEY:
        raise RuntimeError("COHERE_API_KEY is not configured on the backend.")
    return cohere.Client(COHERE_API_KEY)


def embed_texts(texts: list[str], input_type: str) -> list[list[float]]:
    response = _client().embed(
        texts=texts,
        model=COHERE_EMBED_MODEL,
        input_type=input_type,
        truncate="END",
    )
    return [list(vector) for vector in response.embeddings]


def extract_text(filename: str, data: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        try:
            with pymupdf.open(stream=data, filetype="pdf") as pdf:
                if pdf.needs_pass:
                    raise ValueError("Password-protected PDF files are not supported.")
                text = "\n".join(page.get_text("text") for page in pdf)
        except pymupdf.FileDataError as error:
            raise ValueError("The uploaded PDF could not be opened.") from error
    elif suffix == ".txt":
        text = data.decode("utf-8-sig")
    else:
        raise ValueError("Only PDF and UTF-8 text files are supported.")

    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        raise ValueError("This file has no extractable text.")
    return text


def add_document(filename: str, data: bytes) -> dict:
    if len(data) > MAX_FILE_BYTES:
        raise ValueError("Files must be 10 MB or smaller.")

    text = extract_text(filename, data)
    chunks = [item.page_content for item in _splitter.split_documents([Document(page_content=text)])]
    if len(chunks) > MAX_CHUNKS_PER_DOCUMENT:
        raise ValueError("This document is too long to index (maximum 500 chunks).")

    embeddings: list[list[float]] = []
    for offset in range(0, len(chunks), 96):
        embeddings.extend(embed_texts(chunks[offset : offset + 96], "search_document"))

    document_id = str(uuid.uuid4())
    with connect() as connection:
        connection.execute(
            "INSERT INTO documents (id, name) VALUES (?, ?)",
            (document_id, Path(filename).name),
        )
        connection.executemany(
            "INSERT INTO chunks (document_id, content, embedding) VALUES (?, ?, ?)",
            [
                (document_id, chunk, json.dumps(embedding))
                for chunk, embedding in zip(chunks, embeddings)
            ],
        )
    return {"id": document_id, "name": Path(filename).name, "chunks": len(chunks)}


def list_documents() -> list[dict]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT d.id, d.name, d.created_at, COUNT(c.id) AS chunks
            FROM documents d LEFT JOIN chunks c ON c.document_id = d.id
            GROUP BY d.id ORDER BY d.created_at DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def delete_document(document_id: str) -> bool:
    with connect() as connection:
        cursor = connection.execute("DELETE FROM documents WHERE id = ?", (document_id,))
        return cursor.rowcount > 0


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        return 0.0
    denominator = math.sqrt(sum(x * x for x in left)) * math.sqrt(
        sum(y * y for y in right)
    )
    if denominator == 0:
        return 0.0
    return sum(x * y for x, y in zip(left, right)) / denominator


def retrieve(question: str, limit: int = 5) -> list[dict]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT c.content, c.embedding, d.id AS document_id, d.name
            FROM chunks c JOIN documents d ON d.id = c.document_id
            """
        ).fetchall()
    if not rows:
        return []

    query_embedding = embed_texts([question], "search_query")[0]

    ranked = sorted(
        (
            (
                _cosine_similarity(query_embedding, json.loads(row["embedding"])),
                row,
            )
            for row in rows
        ),
        key=lambda item: item[0],
        reverse=True,
    )
    results = []
    for score, row in ranked[:limit]:
        results.append(
            {
                "document_id": row["document_id"],
                "document_name": row["name"],
                "content": row["content"],
                "score": round(score, 4),
            }
        )
    return results
