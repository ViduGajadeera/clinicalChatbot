import random
import re
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from pydantic import BaseModel

from app.database import get_db
from app.models.domain import User, Attempt, ChatMessage, Scenario
from app.services.auth_service import get_current_user
from app.services.llm_service import generate_response
from app.services.simulation_engine import process_student_message

router = APIRouter()

class StartInput(BaseModel):
    scenario_id: str

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
def start_attempt(data: StartInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == data.scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")
        
    # Start a new attempt for the student
    attempt = Attempt(student_id=current_user.id, scenario_id=scenario.id)
    
    # Initialize the patient state
    attempt.current_patient_state = {
        "treatments_given": [],
        "time_elapsed_mins": 0
    }
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Send initial greeting
    bot_text = f"Nurse, I'm glad you're here. {scenario.presentation.get('chief_complaint', 'I need some help')}."
    
    bot_msg = ChatMessage(
        attempt_id=attempt.id,
        sender="bot",
        message_text=bot_text
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)
    
    return {
        "attempt_id": attempt.id,
        "bot_message": bot_text,
        "action_data": None
    }

@router.get("/{attempt_id}/history")
def get_chat_history(attempt_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.student_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    time_elapsed = (datetime.utcnow() - attempt.timestamp).total_seconds()
    if not attempt.is_completed and time_elapsed > 20 * 60:
        attempt.is_completed = True
        db.commit()

    time_left = max(0, int(20 * 60 - time_elapsed))

    messages = db.query(ChatMessage).filter(ChatMessage.attempt_id == attempt.id).order_by(ChatMessage.timestamp.asc()).all()
    return {
        "is_completed": attempt.is_completed,
        "ai_feedback": attempt.ai_feedback,
        "time_left": time_left,
        "messages": [
            {
                "sender": msg.sender, 
                "text": msg.message_text, 
                "media_url": msg.media_url, 
                "action_data": msg.action_data
            } for msg in messages
        ]
    }

@router.post("/message")
def submit_message(data: MessageInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == data.attempt_id, Attempt.student_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.is_completed:
        return {"error": "This session is already completed.", "is_completed": True}

    if datetime.utcnow() - attempt.timestamp > timedelta(minutes=20):
        attempt.is_completed = True
        db.commit()
        return {"error": "Time limit of 20 minutes exceeded.", "is_completed": True}
        
    # Save user message
    user_msg = ChatMessage(
        attempt_id=attempt.id,
        sender="user",
        message_text=data.message_text
    )
    db.add(user_msg)
    db.commit()
    
    scenario = attempt.scenario
    
    # Construct scenario_data dict
    scenario_data = {
        "patient_profile": scenario.patient_profile,
        "presentation": scenario.presentation,
        "hidden_history": scenario.hidden_history,
        "vitals": scenario.vitals,
        "diagnosis": scenario.diagnosis,
        "available_investigations": scenario.available_investigations,
        "available_examinations": scenario.available_examinations,
        "expected_management": scenario.expected_management,
        "deterioration_rules": scenario.deterioration_rules,
        "recovery_rules": scenario.recovery_rules
    }
    
    current_state = attempt.current_patient_state or {"treatments_given": [], "time_elapsed_mins": 0}
            
    # Get chat history (exclude the current message we just added to build history context)
    history_records = db.query(ChatMessage).filter(
        ChatMessage.attempt_id == attempt.id, 
        ChatMessage.id != user_msg.id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    chat_history = [{"sender": msg.sender, "message_text": msg.message_text} for msg in history_records]

    # Process through the simulation engine
    bot_reply, action_data, updated_state = process_student_message(
        student_message=data.message_text,
        scenario_data=scenario_data,
        current_state=current_state,
        chat_history=chat_history
    )
    
    # Parse for completion
    is_completed = False
    if "[STATUS: COMPLETED]" in bot_reply:
        is_completed = True
        bot_reply = bot_reply.replace("[STATUS: COMPLETED]", "").strip()
        attempt.is_completed = True
        
    # Also check if student just says "I am done" to manually end
    if "end simulation" in data.message_text.lower():
        is_completed = True
        attempt.is_completed = True
        
    # Update Attempt State
    attempt.current_patient_state = updated_state
    
    # Parse potential media
    bot_reply, media_url = parse_llm_response(bot_reply)
    
    bot_msg = ChatMessage(
        attempt_id=attempt.id,
        sender="bot",
        message_text=bot_reply,
        media_url=media_url,
        action_data=action_data
    )
    db.add(bot_msg)
    db.commit()
    
    return {
        "bot_reply": bot_reply,
        "media_url": media_url,
        "action_data": action_data,
        "is_completed": is_completed
    }

@router.post("/{attempt_id}/evaluate")
def evaluate_attempt(attempt_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.student_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.ai_feedback:
        return {"feedback": attempt.ai_feedback}
        
    scenario = attempt.scenario
    
    history = db.query(ChatMessage).filter(ChatMessage.attempt_id == attempt.id).order_by(ChatMessage.timestamp.asc()).all()
    history_context = ""
    for msg in history:
        sender_label = "Student" if msg.sender == "user" else "Patient"
        if msg.action_data:
            history_context += f"{sender_label}: {msg.message_text} [SYSTEM ACTION: {json.dumps(msg.action_data)}]\n"
        else:
            history_context += f"{sender_label}: {msg.message_text}\n"

    prompt = f"""
You are an expert evaluator assessing a student-patient simulation for Informed Consent.
Scenario: {scenario.title}
Patient Profile: {json.dumps(scenario.patient_profile)}
Expected Management: {json.dumps(scenario.expected_management)}
Misconceptions/Hidden History: {json.dumps(scenario.hidden_history)}

Chat Transcript:
{history_context}

Evaluate the student's performance out of 4 for each of the 6 areas in the rubric below (0=Not demonstrated, 1=Poor, 2=Needs improvement, 3=Good, 4=Excellent):
1. Opening & rapport (Greeting, introduction, privacy, respectful start)
2. Assessing patient understanding (Checks knowledge, concerns, readiness)
3. Giving correct information (Explains procedure, benefits, risks, alternatives)
4. Communication & empathy (Listens, emotional response, simple language, checks understanding)
5. Ethics, autonomy & refusal (Voluntary choice, no coercion, respects refusal/rights)
6. Closing & next steps (Summarises, questions, next step, referral)

Also check for these CRITICAL ERRORS:
- "Tells the patient they must sign or have no choice"
- "Pressures, threatens or frightens the patient into consenting"
- "Ignores a clear refusal"
- "Gives false guarantees such as 'nothing will happen'"
- "Treats obtaining a signature as the only goal"

Return ONLY a JSON object exactly matching this schema:
{{
  "ratings": {{
    "opening": number (0-4),
    "understanding": number (0-4),
    "information": number (0-4),
    "empathy": number (0-4),
    "ethics": number (0-4),
    "closing": number (0-4)
  }},
  "critical_errors": [list of strings identifying the triggered critical errors exactly as written above, or empty list],
  "strengths": [2 or 3 bullet points of strengths],
  "improvements": [2 or 3 bullet points of areas for improvement],
  "comment_empathy": "One short comment on empathy and patient-centred communication",
  "comment_autonomy": "One short comment on autonomy, voluntariness and handling refusal",
  "example_improvement": "One example of how the student could improve a weak response"
}}
"""

    raw_response = generate_response(prompt)
    
    # Strip markdown if present
    cleaned_response = raw_response
    if cleaned_response.startswith("```json"):
        cleaned_response = cleaned_response[7:-3].strip()
    elif cleaned_response.startswith("```"):
        cleaned_response = cleaned_response[3:-3].strip()
        
    try:
        eval_data = json.loads(cleaned_response)
    except Exception as e:
        # Fallback if LLM fails to output valid JSON
        attempt.ai_feedback = f"Error generating structured evaluation: {e}\n\nRaw Response:\n{raw_response}"
        attempt.is_completed = True
        db.commit()
        return {"feedback": attempt.ai_feedback}

    ratings = eval_data.get("ratings", {})
    
    # Weights
    weights = {
        "opening": 10,
        "understanding": 15,
        "information": 25,
        "empathy": 20,
        "ethics": 20,
        "closing": 10
    }
    
    total_score = 0
    for key, weight in weights.items():
        rating = ratings.get(key, 0)
        total_score += (rating / 4.0) * weight
        
    critical_errors = eval_data.get("critical_errors", [])
    deduction = len(critical_errors) * 15
    final_score = max(0, round(total_score - deduction))
    
    # Interpretation
    if final_score >= 80:
        interpretation = "Excellent"
    elif final_score >= 65:
        interpretation = "Good / Satisfactory"
    elif final_score >= 50:
        interpretation = "Needs Improvement"
    else:
        interpretation = "Unsatisfactory – further practice recommended"
        
    # Build Markdown Feedback
    feedback_md = f"## Evaluation Score: {final_score}/100 ({interpretation})\n\n"
    
    feedback_md += "### Marks Breakdown\n"
    feedback_md += f"- **Opening & rapport**: {ratings.get('opening', 0)}/4\n"
    feedback_md += f"- **Assessing patient understanding**: {ratings.get('understanding', 0)}/4\n"
    feedback_md += f"- **Giving correct information**: {ratings.get('information', 0)}/4\n"
    feedback_md += f"- **Communication & empathy**: {ratings.get('empathy', 0)}/4\n"
    feedback_md += f"- **Ethics, autonomy & refusal**: {ratings.get('ethics', 0)}/4\n"
    feedback_md += f"- **Closing & next steps**: {ratings.get('closing', 0)}/4\n\n"
    
    if critical_errors:
        feedback_md += "### ⚠️ Critical Errors / Warning Flags\n"
        for ce in critical_errors:
            feedback_md += f"- **{ce}** (-15 deduction)\n"
        feedback_md += "\n"
        
    feedback_md += "### Strengths\n"
    for s in eval_data.get("strengths", []):
        feedback_md += f"- {s}\n"
        
    feedback_md += "\n### Areas for Improvement\n"
    for i in eval_data.get("improvements", []):
        feedback_md += f"- {i}\n"
        
    feedback_md += f"\n### Empathy & Patient-Centred Communication\n{eval_data.get('comment_empathy', '')}\n"
    
    feedback_md += f"\n### Autonomy, Voluntariness & Handling Refusal\n{eval_data.get('comment_autonomy', '')}\n"
    
    feedback_md += f"\n### Example for Improvement\n{eval_data.get('example_improvement', '')}\n"

    attempt.ai_feedback = feedback_md
    attempt.is_completed = True
    db.commit()
    
    return {"feedback": feedback_md}