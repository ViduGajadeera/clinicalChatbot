from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from app.config import PINECONE_API_KEY, PINECONE_INDEX

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX)

model = SentenceTransformer("all-MiniLM-L6-v2")

def embed(text):
    return model.encode(text).tolist()

def store_scenario(scenario):
    vectors = []

    for q in scenario.questions:
        text = scenario.description + " " + q.question

        vectors.append({
            "id": q.question_id,
            "values": embed(text),
            "metadata": {
                "question": q.question,
                "expected_answer": q.expected_answer,
                "media": q.media
            }
        })

    index.upsert(vectors)

def query_vector(query):
    result = index.query(
        vector=embed(query),
        top_k=1,
        include_metadata=True
    )

    return result["matches"][0]["metadata"]