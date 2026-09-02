import os
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1"
GROQ_MODEL = os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"

DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./kiu_database.db"

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY") or "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60 # 30 days for convenience
