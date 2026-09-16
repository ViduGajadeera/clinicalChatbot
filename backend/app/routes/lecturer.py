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

import re

def extract_score(feedback: str):
    if not feedback:
        return None
    match = re.search(r'Evaluation Score: (\d+)/100', feedback)
    if match:
        return float(match.group(1))
    return None

@router.get("/kpis")
def get_kpis(current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    from app.models.domain import Scenario
    scenarios = db.query(Scenario).all()
    result = []
    for sc in scenarios:
        attempts = db.query(Attempt).join(User, Attempt.student_id == User.id).filter(Attempt.scenario_id == sc.id, User.role == 'student').all()
        count = len(attempts)
        max_score = 0
        for a in attempts:
            score = extract_score(a.ai_feedback)
            if score is not None and score > max_score:
                max_score = score
                
        result.append({
            "scenario_id": sc.scenario_id,
            "title": sc.title,
            "count": count,
            "max_score": max_score
        })
    return result

@router.get("/students/{student_id}/progress")
def get_student_progress(student_id: str, current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    attempts = db.query(Attempt).filter(Attempt.student_id == student_id).order_by(Attempt.timestamp.asc()).all()
    
    result = []
    for a in attempts:
        scenario_title = a.scenario.title if a.scenario else "Unknown Scenario"
        score = extract_score(a.ai_feedback)
        result.append({
            "attempt_id": a.id, 
            "timestamp": a.timestamp,
            "scenario_title": scenario_title,
            "score": score
        })
    return result

@router.get("/attempts/{attempt_id}")
def get_attempt_details(attempt_id: str, current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    scenario = attempt.scenario
    
    if scenario:
        questions = db.query(Question).filter(Question.scenario_id == scenario.id).all()
        # The old description field was removed; we now use the presentation json.
        description = scenario.presentation.get('chief_complaint', 'Clinical Scenario') if isinstance(scenario.presentation, dict) else 'Clinical Scenario'
        
        source_context = {
            "title": scenario.title,
            "description": description,
            "questions": [{"text": q.question_text, "expected": q.expected_answer, "media": q.media} for q in questions]
        }
    else:
        source_context = {
            "title": "Unknown Scenario",
            "description": "This scenario has been removed or is unavailable.",
            "questions": []
        }
    
    messages = db.query(ChatMessage).filter(ChatMessage.attempt_id == attempt.id).order_by(ChatMessage.timestamp.asc()).all()
    transcript = [{"sender": msg.sender, "text": msg.message_text, "media_url": msg.media_url, "timestamp": msg.timestamp} for msg in messages]
        
    return {
        "attempt_id": attempt.id,
        "student": f"{attempt.student.first_name} {attempt.student.last_name}",
        "timestamp": attempt.timestamp,
        "source_context": source_context,
        "transcript": transcript,
        "ai_feedback": attempt.ai_feedback
    }

@router.delete("/students/{student_id}")
def delete_student(student_id: str, current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}

import csv
import io
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime

@router.get("/reports/export")
def export_reports(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    current_user: User = Depends(require_lecturer), 
    db: Session = Depends(get_db)
):
    query = db.query(Attempt).join(User, Attempt.student_id == User.id).filter(User.role == 'student')
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00")).replace(tzinfo=None)
            query = query.filter(Attempt.timestamp >= start_dt)
        except ValueError:
            pass
            
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00")).replace(tzinfo=None)
            query = query.filter(Attempt.timestamp <= end_dt)
        except ValueError:
            pass
            
    attempts = query.order_by(Attempt.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Attempt Date", "Students' Name", "Attended Scenario", "Time taken", "Total score"])
    
    for a in attempts:
        date_str = a.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        student_name = f"{a.student.first_name} {a.student.last_name}"
        scenario_title = a.scenario.title if a.scenario else "Unknown Scenario"
        
        last_msg = db.query(ChatMessage).filter(ChatMessage.attempt_id == a.id).order_by(ChatMessage.timestamp.desc()).first()
        if last_msg:
            time_spent_secs = (last_msg.timestamp - a.timestamp).total_seconds()
        else:
            time_spent_secs = 0
            
        time_spent_secs = max(0, min(time_spent_secs, 1200))
        mins = int(time_spent_secs // 60)
        secs = int(time_spent_secs % 60)
        time_taken = f"{mins}m {secs}s"
        
        score = extract_score(a.ai_feedback)
        score_val = f"{score}/100" if score is not None else "N/A"
        
        writer.writerow([date_str, student_name, scenario_title, time_taken, score_val])
        
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=clinical_ai_reports.csv"
    return response
