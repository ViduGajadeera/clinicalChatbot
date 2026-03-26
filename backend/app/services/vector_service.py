import threading

from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

from app.config import PINECONE_API_KEY, PINECONE_INDEX

_model = None
_index = None
_lock = threading.Lock()


def _get_model():
    """Lazy-load the embedding model to avoid slow startup on deploy."""
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _get_index():
    """Lazy-load Pinecone client/index to avoid startup failures/timeouts."""
    global _index
    if _index is None:
        if not PINECONE_API_KEY or not PINECONE_INDEX:
            raise RuntimeError("PINECONE_API_KEY and PINECONE_INDEX must be set.")

        with _lock:
            if _index is None:
                pc = Pinecone(api_key=PINECONE_API_KEY)
                _index = pc.Index(PINECONE_INDEX)
    return _index


def embed(text: str):
    model = _get_model()
    return model.encode(text).tolist()


def store_scenario(scenario):
    index = _get_index()
    vectors = []

    for q in scenario.questions:
        text = scenario.description + " " + q.question

        vectors.append(
            {
                "id": q.question_id,
                "values": embed(text),
                "metadata": {
                    "question": q.question,
                    "expected_answer": q.expected_answer,
                    "media": q.media,
                },
            }
        )

    index.upsert(vectors)


def query_vector(query: str):
    index = _get_index()
    result = index.query(
        vector=embed(query),
        top_k=1,
        include_metadata=True,
    )

    matches = result.get("matches") or []
    if not matches:
        return None

    return matches[0].get("metadata")