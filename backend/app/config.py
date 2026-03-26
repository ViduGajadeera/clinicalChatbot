import os
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1"
GROQ_MODEL = os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"
