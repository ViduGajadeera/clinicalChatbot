from pydantic import BaseModel
from typing import List

class Question(BaseModel):
    question_id: str
    question: str
    expected_answer: str
    media: List[str] = []

class Scenario(BaseModel):
    scenario_id: str
    title: str
    description: str
    questions: List[Question]

class ChatRequest(BaseModel):
    user_input: str

class EvalRequest(BaseModel):
    student_answer: str
    expected_answer: str