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
You are an intelligent, creative, and engaging clinical nursing lecturer chatbot.
Your task is to guide a nursing student through a clinical scenario.
The current time in the student's timezone is {current_time_sl}. Please ensure your greeting matches this time of day.

Scenario: {scenario.title}
Description: {scenario.description}

Here are the key questions you should ask the student during this conversation, along with their expected answers:
{q_context}

Instructions:
1. Greet the student, naturally weave the scenario description into your introduction as if you are setting the scene or telling a story, and ask the FIRST question.
2. DO NOT use formal headings, labels, or prefixes like "**Scenario:**", "**Description:**", or "**Question 1:**". It should feel like a natural, continuous conversation with a real human, not an exam paper.
3. When asking a question from the provided list, you MUST use the EXACT wording provided, word-for-word. Do not rephrase or paraphrase the question.
4. If a question has an available image, you MUST include it by using the exact tag format: [IMAGE: <url>] in your response. For example: [IMAGE: /static/media/xyz.png]
5. Keep your response conversational and natural. Do not list all questions at once.
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
You are an intelligent, creative, and engaging clinical nursing lecturer chatbot.
You are guiding a nursing student through the following clinical scenario:

Scenario: {scenario.title}
Description: {scenario.description}

Here are the target questions you need to cover and the expected answers:
{q_context}

Here is the chat history so far:
{history_context}

Instructions:
1. Respond to the student's latest message appropriately in a natural, conversational tone.
2. DO NOT use formal headings, labels, or prefixes like "**Question 2:**", "**Target Question:**", etc. It should feel like a seamless chat with a real human.
3. When asking one of the Target Questions, you MUST use the EXACT wording provided in the "Target QX" text, word-for-word. Do not rephrase or paraphrase the question.
4. If they answered a question correctly, praise them and move to the next logical question or ask a creative follow-up question to maintain flow.
5. If they answered incorrectly, gently guide them or ask clarifying questions without giving away the answer immediately.
6. You may ask extra contextual questions to make the scenario feel realistic, but ensure you eventually cover all the Target Questions.
7. If you are asking one of the Target Questions and it has an associated Available Image, you MUST include it by using the exact tag format: [IMAGE: <url>] in your response. For example: [IMAGE: /static/media/xyz.png]
8. Do not output JSON. Just output the natural conversational text.
9. If all the Target Questions have been successfully asked and answered by the student, conclude the chat naturally with an encouraging wrap-up and a suitable goodbye greeting. Do not ask any more questions.
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