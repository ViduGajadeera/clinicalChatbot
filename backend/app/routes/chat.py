import random
import re
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from pydantic import BaseModel

from app.database import get_db
from app.models.domain import User, Attempt, ChatMessage, Question, Scenario
from app.services.auth_service import get_current_user
from app.services.llm_service import generate_response

router = APIRouter()

class MessageInput(BaseModel):
    attempt_id: str
    message_text: str

def parse_llm_response(text: str):
    """
    Extracts image tags from the LLM response.
    Expected format: [IMAGE: /static/media/filename.png]
    Returns (cleaned_text, media_url)
    """
    media_url = None
    match = re.search(r'\[IMAGE:\s*(.*?)\]', text)
    if match:
        media_url = match.group(1).strip()
        text = re.sub(r'\[IMAGE:\s*.*?\]', '', text).strip()
    return text, media_url

@router.post("/start")
def start_attempt(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Pick a random scenario
    scenario = db.query(Scenario).order_by(func.random()).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="No scenarios available in the database.")
        
    # Start a new attempt for the student
    attempt = Attempt(student_id=current_user.id, scenario_id=scenario.id)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Get questions to inform the LLM what images it has available
    questions = db.query(Question).filter(Question.scenario_id == scenario.id).all()
    q_context = ""
    for idx, q in enumerate(questions):
        q_context += f"Q{idx+1}: {q.question_text}\n"
        q_context += f"Expected Answer: {q.expected_answer}\n"
        if q.media:
            q_context += f"Available Images for Q{idx+1}: {', '.join(q.media)}\n"
    tz_sl = timezone(timedelta(hours=5, minutes=30))
    current_time_sl = datetime.now(tz_sl).strftime("%I:%M %p")
            
    prompt = f"""
You are an AI acting as a patient in a clinical informed consent role-play scenario.
A nursing student or junior nurse will be talking to you to practice the informed decision-making communication process.
The current time in the student's timezone is {current_time_sl}. 

Scenario: {scenario.title}
Patient & Scenario Description: {scenario.description}

Instructions:
1. Act entirely as the patient described above. Start the conversation using the "Opening Statement" if one is provided in the description, or invent a natural, brief opening statement expressing your current concern or question based on your persona.
2. DO NOT act like a lecturer, doctor, or AI assistant. You are the patient.
3. Keep your response conversational, natural, and matching the emotions of the patient (fearful, confused, etc.). Do not reveal all your concerns at once. Let the student guide the conversation.
4. DO NOT use formal headings, labels, or prefixes.
"""
    
    bot_raw_response = generate_response(prompt)
    bot_text, media_url = parse_llm_response(bot_raw_response)
    
    bot_msg = ChatMessage(
        attempt_id=attempt.id,
        sender="bot",
        message_text=bot_text,
        media_url=media_url
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)
    
    return {
        "attempt_id": attempt.id,
        "bot_message": bot_text,
        "media_url": media_url
    }

@router.get("/{attempt_id}/history")
def get_chat_history(attempt_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.student_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.attempt_id == attempt.id).order_by(ChatMessage.timestamp.asc()).all()
    return [{"sender": msg.sender, "text": msg.message_text, "media_url": msg.media_url} for msg in messages]

@router.post("/message")
def submit_message(data: MessageInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == data.attempt_id, Attempt.student_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    # Save user message
    user_msg = ChatMessage(
        attempt_id=attempt.id,
        sender="user",
        message_text=data.message_text
    )
    db.add(user_msg)
    db.commit()
    
    scenario = attempt.scenario
    questions = db.query(Question).filter(Question.scenario_id == scenario.id).all()
    
    q_context = ""
    for idx, q in enumerate(questions):
        q_context += f"Target Q{idx+1}: {q.question_text}\n"
        q_context += f"Expected Answer: {q.expected_answer}\n"
        if q.media:
            q_context += f"Available Images for Q{idx+1}: {', '.join(q.media)}\n"
            
    # Get chat history
    history = db.query(ChatMessage).filter(ChatMessage.attempt_id == attempt.id).order_by(ChatMessage.timestamp.asc()).all()
    
    history_context = ""
    for msg in history:
        sender_label = "Student" if msg.sender == "user" else "Lecturer"
        history_context += f"{sender_label}: {msg.message_text}\n"

    prompt = f"""
You are an AI acting as a patient in a clinical informed consent role-play scenario.
A nursing student or junior nurse is talking to you to practice the informed decision-making communication process.

Scenario: {scenario.title}
Patient & Scenario Description: {scenario.description}

The student needs to cover the following Information/Target Concepts during this conversation:
{q_context}

Here is the chat history so far:
{history_context}

Instructions:
1. Respond to the student's latest message naturally and strictly in character as the patient.
2. DO NOT break character. You are NOT a lecturer or evaluator in your responses.
3. Do not immediately agree to consent. Reveal your concerns gradually based on the scenario description.
4. If the student explains a concept from the Target Concepts clearly and empathetically, you can show better understanding or relief.
5. If the student uses medical jargon, be confused and ask them to explain simply.
6. If the student uses coercive, dismissive, judgmental, or overly technical language, become more resistant or upset.
7. Only consent (or officially refuse, or ask for the doctor) if you feel the student has adequately covered the required concepts and answered your specific concerns.
8. Do not output JSON, labels, or headings. Output only your natural spoken response as the patient.
"""

    bot_raw_response = generate_response(prompt)
    bot_text, media_url = parse_llm_response(bot_raw_response)
    
    bot_msg = ChatMessage(
        attempt_id=attempt.id,
        sender="bot",
        message_text=bot_text,
        media_url=media_url
    )
    db.add(bot_msg)
    db.commit()
    
    return {
        "bot_reply": bot_text,
        "media_url": media_url
    }