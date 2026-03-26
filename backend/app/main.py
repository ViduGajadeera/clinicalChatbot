from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, evaluation, scenario

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat")
app.include_router(evaluation.router, prefix="/evaluate")
app.include_router(scenario.router, prefix="/scenario")

@app.get("/")
def root():
    return {"message": "KIU AI Chatbot Running"}