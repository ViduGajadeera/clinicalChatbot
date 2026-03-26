from fastapi import APIRouter
from pydantic import BaseModel

from app.services.chat_memory import get_history, update_history
from app.services.llm_service import generate_chat_response
from app.services.scenario_service import get_scenario

router = APIRouter()

# 🔹 Simple request model (you can also reuse ChatRequest if you want)
class ChatInput(BaseModel):
    user_input: str
    session_id: str = "default"   # supports multiple users later

# 🔹 TEMP: hardcoded scenario (later make dynamic)
SCENARIO_ID = "SC001"


@router.post("/")
def chat(req: ChatInput):
    # 🧠 Get scenario
    scenario = get_scenario(SCENARIO_ID)

    if not scenario:
        return {"reply": "No scenario loaded. Please upload a scenario first."}

    # 📜 Get chat history
    history = get_history(req.session_id)

    # 🤖 Generate AI response (Groq — Llama 3.3 70B)
    response = generate_chat_response(
        scenario,
        history,
        req.user_input
    )

    # 💾 Save conversation
    update_history(req.session_id, req.user_input, response)

    # 📤 Return response
    return {
        "reply": response
    }