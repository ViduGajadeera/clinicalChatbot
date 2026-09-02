import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import chat, scenario, auth, documents, lecturer, student
from app.database import engine, Base
from app.models import domain

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows Vercel (or any frontend) to communicate with this backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static media dir if it doesn't exist
os.makedirs("app/static/media", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth.router, prefix="/auth")
app.include_router(documents.router, prefix="/documents")
app.include_router(chat.router, prefix="/chat")
app.include_router(lecturer.router, prefix="/lecturer")
app.include_router(student.router, prefix="/student")
app.include_router(scenario.router, prefix="/scenario")

@app.get("/")
def root():
    return {"message": "KIU AI Chatbot Running"}

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host=host, port=port)