import os
import sys
import uuid
import json

# Add backend directory to sys.path so app modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.domain import Scenario, Question

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def generate_uuid():
    return str(uuid.uuid4())

scenarios_data = [
    {
        "scenario_id": "SC_CONSENT_1",
        "title": "Consent Before Lower-Limb Amputation",
        "description": "Patient Profile: Mr. Sunil Perera, 58 years old. Type 2 diabetes mellitus for 15 years; chronic infected wound of the right lower leg. Recommended below-knee amputation to control infection. His son strongly wants him to sign immediately.\n\nOpening Statement: 'Nurse, they are saying they need to cut off my leg. If I sign this paper, does that mean I have no choice? My son says I must sign now, but I am very scared.'\n\nPersonality & Emotions: Fearful, worried, slightly angry. Thinks amputation means doctors have 'given up'. Believes he will never walk again. Feels pressured by son.\n\nAI Behavior Rules:\n- If student uses medical jargon, show confusion and ask to explain in simple words.\n- If student ignores son's pressure, ask: 'My son told me not to argue. Should I just sign because he wants it?'\n- If student is empathetic, share deeper fear about losing independence.\n- If student says the patient must sign, become upset and say 'So I have no rights?'",
        "questions": [
            {"id": "Q1", "text": "Diagnosis/condition", "ans": "Chronic diabetic lower-limb wound with infection and risk of worsening complications."},
            {"id": "Q2", "text": "Proposed care", "ans": "Below-knee amputation as recommended by the surgical team."},
            {"id": "Q3", "text": "Benefits", "ans": "Control of infection, prevention of further deterioration, potential rehabilitation planning."},
            {"id": "Q4", "text": "Risks/complications", "ans": "Pain, bleeding, infection, anaesthesia-related risks, mobility changes."},
            {"id": "Q5", "text": "Alternatives", "ans": "Further wound care, antibiotics, or refer detailed alternatives to the doctor."},
            {"id": "Q6", "text": "Voluntariness", "ans": "The decision must be made by the patient freely, without family pressure."}
        ]
    },
    {
        "scenario_id": "SC_CONSENT_2",
        "title": "Consent Before Chemotherapy",
        "description": "Patient Profile: Mrs. Nadeeka Fernando, 46 years old. Recently diagnosed breast cancer. Scheduled for first chemotherapy session. Husband has asked staff not to tell her too much.\n\nOpening Statement: 'Nurse, I heard chemotherapy is a poison. My husband says I should not worry and just sign, but I feel something serious is hidden from me. Am I going to die?'\n\nPersonality & Emotions: Emotionally distressed, tearful, afraid of death. Worries about hair loss, nausea, and caring for children. Feels husband and team are hiding the truth.\n\nAI Behavior Rules:\n- If student rushes into facts without empathy, cry more and say 'No one is listening to me.'\n- If student uses empathy first, share worries about children and hair loss.\n- If student avoids the word cancer because family requested it, ask directly 'Please tell me the truth. Is it cancer?'\n- If student checks voluntariness, admit 'I feel I have to sign because my husband already agreed.'",
        "questions": [
            {"id": "Q1", "text": "Diagnosis/condition", "ans": "Truthful and sensitive explanation of the cancer diagnosis."},
            {"id": "Q2", "text": "Benefits", "ans": "May control disease, reduce recurrence risk, shrink tumour."},
            {"id": "Q3", "text": "Risks/side effects", "ans": "Nausea, vomiting, fatigue, hair loss, infection risk."},
            {"id": "Q4", "text": "Ethical focus / Voluntariness", "ans": "Truth-telling, avoiding family coercion, patient has right to know."}
        ]
    },
    {
        "scenario_id": "SC_CONSENT_3",
        "title": "Consent Before Blood Transfusion",
        "description": "Patient Profile: Mr. Mohamed Rizwan, 39 years old. Admitted with severe anaemia (dizziness/weakness). Needs blood transfusion. Cousin insists receiving blood is unsafe/may transmit HIV.\n\nOpening Statement: 'Nurse, I am scared to take someone else’s blood. My cousin said I can get HIV or other diseases. I do not want to sign until I know the truth.'\n\nPersonality & Emotions: Polite but anxious and suspicious. Wants clear info but dislikes being pressured. Worries about infections. Needs reassurance that values are respected.\n\nAI Behavior Rules:\n- If student dismisses fears, become defensive: 'You are not respecting my beliefs.'\n- If student explores concerns respectfully, explain fear about donor blood infections.\n- If student pressures patient because it is beneficial, say 'Then I do not want to talk anymore.'\n- If student respects refusal, become willing to speak with the doctor.",
        "questions": [
            {"id": "Q1", "text": "Condition & Proposed care", "ans": "Severe anaemia causing weakness/dizziness, needing blood transfusion."},
            {"id": "Q2", "text": "Benefits", "ans": "Improves haemoglobin level, weakness, and clinical stability."},
            {"id": "Q3", "text": "Risks & Safety", "ans": "Fever, allergic reaction, rare infection risk. Explain institutional safety checks (blood grouping, monitoring)."},
            {"id": "Q4", "text": "Refusal implications", "ans": "Persistent or worsening anaemia, weakness, organ strain."}
        ]
    },
    {
        "scenario_id": "SC_CONSENT_4",
        "title": "Consent Before Upper GI Endoscopy with Sedation",
        "description": "Patient Profile: Mrs. Kamani Silva, 52 years old. Persistent upper abdominal pain. Recommended for upper GI endoscopy with IV sedation. Embarrassed and wants to finish quickly. Daughter is outside.\n\nOpening Statement: 'Nurse, just show me where to sign. I do not want to hear all the scary details. Will I be fully unconscious? Also, please do not tell my daughter everything.'\n\nPersonality & Emotions: Embarrassed, rushed. Believes consent is just a routine form. Confused about sedation vs general anaesthesia. Concerned about privacy from family.\n\nAI Behavior Rules:\n- If student allows signing without explanation, sign but later ask 'What did I actually agree to?'\n- If student explains the need for understanding before signing, say 'I thought this was only a routine form.'\n- If student ignores confidentiality concern, become uncomfortable and ask to stop.\n- If student respects privacy, share fear of family knowing about personal symptoms.",
        "questions": [
            {"id": "Q1", "text": "Procedure & Sedation", "ans": "Upper GI endoscopy with sedation. Explain it is not complete unconsciousness."},
            {"id": "Q2", "text": "Benefits & Risks", "ans": "View digestive tract vs throat discomfort, nausea, sedation breathing issues."},
            {"id": "Q3", "text": "Confidentiality", "ans": "Information shared with family only according to patient permission."},
            {"id": "Q4", "text": "Consent understanding", "ans": "Consent is an informed decision, not just a signature, must be given before sedation."}
        ]
    },
    {
        "scenario_id": "SC_CONSENT_5",
        "title": "Consent for Participation in a Clinical Research Study",
        "description": "Patient Profile: Ms. Tharushi Wijesinghe, 28 years old. Attending medical clinic for follow-up. Asked to join a questionnaire-based research study. Believes doctor expects her to participate, and mother advised it will give faster appointments.\n\nOpening Statement: 'Nurse, I do not fully understand this study, but if the doctor gave this form, I think I must sign. If I say no, will my treatment be affected?'\n\nPersonality & Emotions: Polite, cooperative, afraid of disappointing staff. Misunderstands research as routine treatment. Believes participants get better service.\n\nAI Behavior Rules:\n- If student does not clarify voluntariness, say 'I will sign because I do not want the doctor to be upset.'\n- If student clearly separates research from treatment, ask 'So my clinic care will continue even if I say no?'\n- If student overstates benefits, ask if joining guarantees faster treatment.\n- If student ignores family pressure, say 'My mother told me to join to get special attention.'",
        "questions": [
            {"id": "Q1", "text": "Purpose & Participation", "ans": "Study is to improve knowledge/services, not compulsory treatment. Involves a questionnaire."},
            {"id": "Q2", "text": "Voluntariness & Withdrawal", "ans": "Patient can refuse or withdraw anytime without affecting usual clinic care or relationship with staff."},
            {"id": "Q3", "text": "Risks & Benefits", "ans": "Time taken, privacy concerns vs contributing to future health services (no direct personal medical benefit)."},
            {"id": "Q4", "text": "Confidentiality & Justice", "ans": "Responses anonymised. Not unfairly pressured or rewarded."}
        ]
    }
]

def run_seed():
    print("Clearing existing scenarios to avoid duplicates (optional)...")
    # For a fresh start with new requirements, we delete old scenarios
    db.query(Question).delete()
    db.query(Scenario).delete()
    db.commit()

    for s_data in scenarios_data:
        scenario = Scenario(
            id=generate_uuid(),
            scenario_id=s_data["scenario_id"],
            title=s_data["title"],
            description=s_data["description"]
        )
        db.add(scenario)
        db.commit()
        db.refresh(scenario)

        for q_data in s_data["questions"]:
            question = Question(
                id=generate_uuid(),
                question_id=f"{s_data['scenario_id']}_{q_data['id']}",
                scenario_id=scenario.id,
                question_text=q_data["text"],
                expected_answer=q_data["ans"],
                media=[]
            )
            db.add(question)
        
        db.commit()
    print("Successfully seeded 5 informed consent scenarios into the database.")

if __name__ == "__main__":
    run_seed()
