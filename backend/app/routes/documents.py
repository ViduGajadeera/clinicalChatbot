from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.domain import User, Document, Scenario, Question
from app.services.auth_service import require_lecturer
from app.services.document_parser import parse_docx
from app.services.vector_service import store_scenario

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(require_lecturer),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are allowed")

    content = await file.read()
    
    # Parse the document
    try:
        parsed_scenarios = parse_docx(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse document: {str(e)}")
        
    if not parsed_scenarios:
        raise HTTPException(status_code=400, detail="No scenarios found in the document")

    # Save Document to DB
    db_doc = Document(filename=file.filename, uploaded_by_id=current_user.id)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    for s_data in parsed_scenarios:
        db_scenario = Scenario(
            scenario_id=s_data["scenario_id"],
            title=s_data["title"],
            description=s_data["description"],
            document_id=db_doc.id
        )
        db.add(db_scenario)
        db.commit()
        db.refresh(db_scenario)
        
        for q_data in s_data["questions"]:
            db_question = Question(
                question_id=q_data["question_id"],
                scenario_id=db_scenario.id,
                question_text=q_data["question"],
                expected_answer=q_data["expected_answer"],
                media=q_data.get("media", [])
            )
            db.add(db_question)
            
            # Since store_scenario uses a Pydantic schema (from schemas.py), we need to adapt it
            # Actually, vector_service.py expects `scenario.description`, `scenario.questions`, etc.
            # We will refactor vector_service to handle the SQLAlchemy models directly or pass a simple object.

    db.commit()
    
    # Sync with Pinecone (RAG)
    for s_data in parsed_scenarios:
        # We can construct a temporary object that mimics the old Pydantic model for vector_service
        class DummyQ:
            def __init__(self, q):
                self.question_id = q["question_id"]
                self.question = q["question"]
                self.expected_answer = q["expected_answer"]
                self.media = q.get("media", [])
                
        class DummyS:
            def __init__(self, s):
                self.scenario_id = s["scenario_id"]
                self.title = s["title"]
                self.description = s["description"]
                self.questions = [DummyQ(q) for q in s["questions"]]
                
        try:
            store_scenario(DummyS(s_data))
        except Exception as e:
            # We can log this but we shouldn't fail the upload if pinecone is temporarily down
            print(f"Failed to store in Pinecone: {e}")

    return {"message": "Document uploaded and processed successfully", "document_id": db_doc.id, "scenarios_found": len(parsed_scenarios)}

@router.get("/")
def list_documents(current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    docs = db.query(Document).all()
    return [{"id": d.id, "filename": d.filename, "upload_date": d.upload_date, "uploaded_by": d.uploaded_by.email} for d in docs]

@router.delete("/{document_id}")
def delete_document(document_id: str, current_user: User = Depends(require_lecturer), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.delete(doc)
    db.commit()
    # Note: Removing from Pinecone requires querying by metadata or IDs, which would need a vector_service update
    return {"message": "Document deleted successfully"}
