from app.database import SessionLocal
from app.models.domain import Scenario
import json

db = SessionLocal()
scenarios = db.query(Scenario).all()
for s in scenarios:
    print(f"ID: {s.id}")
    print(f"Type of presentation: {type(s.presentation)}")
    if isinstance(s.presentation, str):
        pres = json.loads(s.presentation)
        print(f"Chief complaint: {pres.get('chief_complaint')}")
    else:
        print(f"Chief complaint: {s.presentation.get('chief_complaint')}")
