from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.domain import User, Attempt, ChatMessage, Question
from app.services.auth_service import require_lecturer, get_current_user

router = APIRouter()

@router.get("/students")
def get_students(current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    students = db.query(User).filter(User.role == "student").all()
    result = []
    for student in students:
        attempts_count = db.query(Attempt).filter(Attempt.student_id == student.id).count()
        result.append({
            "id": student.id,
            "name": f"{student.first_name} {student.last_name}",
            "email": student.email,
            "attempts_count": attempts_count
        })
    return result

@router.get("/students/{student_id}/progress")
def get_student_progress(student_id: str, current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    attempts = db.query(Attempt).filter(Attempt.student_id == student_id).order_by(Attempt.timestamp.asc()).all()
    return [{"attempt_id": a.id, "timestamp": a.timestamp} for a in attempts]

@router.get("/attempts/{attempt_id}")
def get_attempt_details(attempt_id: str, current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    scenario = attempt.scenario
    questions = db.query(Question).filter(Question.scenario_id == scenario.id).all()
    
    source_context = {
        "title": scenario.title,
        "description": scenario.description,
        "questions": [{"text": q.question_text, "expected": q.expected_answer, "media": q.media} for q in questions]
    }
    
    messages = db.query(ChatMessage).filter(ChatMessage.attempt_id == attempt.id).order_by(ChatMessage.timestamp.asc()).all()
    transcript = [{"sender": msg.sender, "text": msg.message_text, "media_url": msg.media_url, "timestamp": msg.timestamp} for msg in messages]
        
    return {
        "attempt_id": attempt.id,
        "student": f"{attempt.student.first_name} {attempt.student.last_name}",
        "timestamp": attempt.timestamp,
        "source_context": source_context,
        "transcript": transcript
    }

@router.delete("/students/{student_id}")
def delete_student(student_id: str, current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}
