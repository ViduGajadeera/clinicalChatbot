from fastapi import APIRouter
from app.models.schemas import EvalRequest
from app.services.evaluation_service import evaluate_answer

router = APIRouter()

@router.post("/")
def evaluate(req: EvalRequest):
    return {"evaluation": evaluate_answer(req.student_answer, req.expected_answer)}