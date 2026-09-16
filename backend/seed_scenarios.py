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
        "scenario_id": "CONSENT_001",
        "title": "Consent Before Lower-Limb Amputation",
        
        "patient_profile": {
            "name": "Mr. Sunil Perera",
            "age": 58,
            "sex": "Male",
            "occupation": "Not specified",
            "personality": "Fearful, worried, slightly angry, feels pressured by family",
            "setting": "Surgical Ward"
        },
        
        "presentation": {
            "chief_complaint": "Type 2 diabetes mellitus for 15 years; chronic infected wound of the right lower leg.",
            "onset": "Chronic",
            "duration": "Chronic",
            "severity": "Severe infection",
            "location": "Right lower leg",
            "character": "Infected wound",
            "aggravating_factors": "None specified",
            "relieving_factors": "None specified"
        },
        
        "hidden_history": {
            "associated_symptoms": [],
            "past_medical_history": "Type 2 diabetes mellitus for 15 years",
            "past_surgical_history": "None specified",
            "medications": "None specified",
            "allergies": "None specified",
            "family_history": "Son strongly wants the patient to sign immediately because he is worried the condition may worsen.",
            "social_history": "None specified",
            "misconceptions": "Thinks amputation means doctors have given up. Believes he will never be able to walk again or live independently. Feels pressured by his son."
        },
        
        "vitals": {
            "temperature": "Normal",
            "heart_rate": "Normal",
            "blood_pressure": "Normal",
            "respiratory_rate": "Normal",
            "spo2": "Normal"
        },
        
        "diagnosis": {
            "primary": "Chronic infected foot wound with recommended below-knee amputation",
            "differentials": []
        },
        
        "available_investigations": {},
        "available_examinations": {},
        
        "expected_management": [
            "Assess what he already knows about his condition and the recommended surgery.",
            "Clarify that informed consent is not just signing a form.",
            "Explore whether he feels pressured by family and support his right to decide voluntarily.",
            "Encourage him to ask the surgeon further questions about surgical details, risks, and alternatives.",
            "Use teach-back to confirm understanding."
        ],
        "deterioration_rules": [],
        "recovery_rules": []
    },
    {
        "scenario_id": "CONSENT_002",
        "title": "Consent Before Chemotherapy",
        
        "patient_profile": {
            "name": "Mrs. Nadeeka Fernando",
            "age": 46,
            "sex": "Female",
            "occupation": "Not specified",
            "personality": "Emotionally distressed, tearful, afraid of death",
            "setting": "Oncology Ward"
        },
        
        "presentation": {
            "chief_complaint": "Recently diagnosed breast cancer. Scheduled for first chemotherapy session.",
            "onset": "Recent",
            "duration": "Recent",
            "severity": "N/A",
            "location": "Breast",
            "character": "N/A",
            "aggravating_factors": "N/A",
            "relieving_factors": "N/A"
        },
        
        "hidden_history": {
            "associated_symptoms": [],
            "past_medical_history": "Breast cancer",
            "past_surgical_history": "None specified",
            "medications": "None specified",
            "allergies": "None specified",
            "family_history": "Husband asked staff not to tell her too much because he fears she will lose hope.",
            "social_history": "Worries about hair loss, nausea, body image, family responsibilities, and caring for her children.",
            "misconceptions": "Believes chemotherapy always causes unbearable suffering. Believes it is a poison. Feels husband and team are hiding the truth."
        },
        
        "vitals": {
            "temperature": "Normal",
            "heart_rate": "Normal",
            "blood_pressure": "Normal",
            "respiratory_rate": "Normal",
            "spo2": "Normal"
        },
        
        "diagnosis": {
            "primary": "Breast cancer requiring chemotherapy",
            "differentials": []
        },
        
        "available_investigations": {},
        "available_examinations": {},
        
        "expected_management": [
            "Acknowledge her fear and allow her to express emotions.",
            "Clarify what she has already been told and what she wants to know.",
            "Correct misconception that chemotherapy is simply poison.",
            "Respect right to know and involve family if she wishes.",
            "Refer detailed prognosis and treatment to the oncologist."
        ],
        "deterioration_rules": [],
        "recovery_rules": []
    },
    {
        "scenario_id": "CONSENT_003",
        "title": "Consent Before Blood Transfusion",
        
        "patient_profile": {
            "name": "Mr. Mohamed Rizwan",
            "age": 39,
            "sex": "Male",
            "occupation": "Not specified",
            "personality": "Polite but strongly anxious and suspicious about safety. Has cultural concerns.",
            "setting": "Medical Ward"
        },
        
        "presentation": {
            "chief_complaint": "Severe anaemia with symptoms of dizziness and weakness.",
            "onset": "Recent",
            "duration": "Recent",
            "severity": "Severe",
            "location": "Systemic",
            "character": "Dizziness, weakness",
            "aggravating_factors": "N/A",
            "relieving_factors": "N/A"
        },
        
        "hidden_history": {
            "associated_symptoms": ["Dizziness", "Weakness"],
            "past_medical_history": "Severe anaemia",
            "past_surgical_history": "None specified",
            "medications": "None specified",
            "allergies": "None specified",
            "family_history": "Relative insists that receiving blood is unsafe and may change patient's identity or beliefs.",
            "social_history": "Has cultural/family concerns about receiving blood from an unknown donor.",
            "misconceptions": "Cousin said he can get HIV or other diseases. Afraid that refusing means staff will stop caring for him."
        },
        
        "vitals": {
            "temperature": "Normal",
            "heart_rate": "Normal",
            "blood_pressure": "Normal",
            "respiratory_rate": "Normal",
            "spo2": "Normal"
        },
        
        "diagnosis": {
            "primary": "Severe anaemia requiring blood transfusion",
            "differentials": []
        },
        
        "available_investigations": {},
        "available_examinations": {},
        
        "expected_management": [
            "Ask permission to discuss transfusion and check if family member should be present.",
            "Explore concerns and previous knowledge about blood transfusion.",
            "Explain that consent is required because it has benefits and potential risks.",
            "Correct misinformation carefully without dismissing cultural beliefs.",
            "Explain right to accept, refuse, or ask for more time.",
            "Confirm understanding and inform doctor if patient refuses or remains uncertain."
        ],
        "deterioration_rules": [],
        "recovery_rules": []
    },
    {
        "scenario_id": "CONSENT_004",
        "title": "Consent Before Upper GI Endoscopy",
        
        "patient_profile": {
            "name": "Mrs. Kamani Silva",
            "age": 52,
            "sex": "Female",
            "occupation": "Not specified",
            "personality": "Embarrassed, rushed, avoidant of details",
            "setting": "Gastroenterology Ward"
        },
        
        "presentation": {
            "chief_complaint": "Persistent upper abdominal pain and vomiting. Recommended for upper GI endoscopy with IV sedation.",
            "onset": "Persistent",
            "duration": "Persistent",
            "severity": "Moderate",
            "location": "Upper abdomen",
            "character": "Pain, vomiting",
            "aggravating_factors": "N/A",
            "relieving_factors": "N/A"
        },
        
        "hidden_history": {
            "associated_symptoms": ["Vomiting"],
            "past_medical_history": "None specified",
            "past_surgical_history": "None specified",
            "medications": "None specified",
            "allergies": "None specified",
            "family_history": "Daughter is outside the room and wants updates, but patient is uncomfortable sharing everything.",
            "social_history": "None specified",
            "misconceptions": "Believes consent form is only a hospital routine. Confused about difference between sedation and general anaesthesia. Wants to just sign quickly without understanding."
        },
        
        "vitals": {
            "temperature": "Normal",
            "heart_rate": "Normal",
            "blood_pressure": "Normal",
            "respiratory_rate": "Normal",
            "spo2": "Normal"
        },
        
        "diagnosis": {
            "primary": "Upper abdominal pain requiring endoscopy with sedation",
            "differentials": []
        },
        
        "available_investigations": {},
        "available_examinations": {},
        
        "expected_management": [
            "Explain that consent should be obtained before sedation and after proper understanding.",
            "Respect privacy and clarify what info may be shared with daughter.",
            "Ask what she knows about endoscopy and sedation.",
            "Explain procedure purpose, benefits, discomforts, risks, and alternatives simply.",
            "Use teach-back and encourage her to ask the doctor questions."
        ],
        "deterioration_rules": [],
        "recovery_rules": []
    },
    {
        "scenario_id": "CONSENT_005",
        "title": "Consent for Clinical Research Study",
        
        "patient_profile": {
            "name": "Ms. Tharushi Wijesinghe",
            "age": 28,
            "sex": "Female",
            "occupation": "Not specified",
            "personality": "Polite, cooperative, afraid of disappointing healthcare staff",
            "setting": "Medical Clinic"
        },
        
        "presentation": {
            "chief_complaint": "Attending medical clinic for long-term follow-up. Asked to participate in a questionnaire-based research study.",
            "onset": "N/A",
            "duration": "Long-term follow-up",
            "severity": "N/A",
            "location": "N/A",
            "character": "N/A",
            "aggravating_factors": "N/A",
            "relieving_factors": "N/A"
        },
        
        "hidden_history": {
            "associated_symptoms": [],
            "past_medical_history": "Long-term condition requiring follow-up",
            "past_surgical_history": "None specified",
            "medications": "None specified",
            "allergies": "None specified",
            "family_history": "Mother advises her to participate because she thinks it gives faster appointments.",
            "social_history": "None specified",
            "misconceptions": "Thinks participation is compulsory. Believes participants receive better services. Worries refusal will anger the doctor. Worries about confidentiality."
        },
        
        "vitals": {
            "temperature": "Normal",
            "heart_rate": "Normal",
            "blood_pressure": "Normal",
            "respiratory_rate": "Normal",
            "spo2": "Normal"
        },
        
        "diagnosis": {
            "primary": "Long-term follow-up patient considering research participation",
            "differentials": []
        },
        
        "available_investigations": {},
        "available_examinations": {},
        
        "expected_management": [
            "Explain that research participation is voluntary and separate from routine care.",
            "Confirm that refusal will not affect treatment or appointments.",
            "Explain purpose, involvement, risks (privacy), and benefits.",
            "Check understanding of information sheet and consent form.",
            "Encourage questions and allow time to decide without pressure."
        ],
        "deterioration_rules": [],
        "recovery_rules": []
    }
]

def run_seed():
    print("Clearing existing scenarios to avoid duplicates...")
    db.query(Question).delete()
    db.query(Scenario).delete()
    db.commit()

    for s_data in scenarios_data:
        scenario = Scenario(
            id=generate_uuid(),
            scenario_id=s_data["scenario_id"],
            title=s_data["title"],
            patient_profile=s_data["patient_profile"],
            presentation=s_data["presentation"],
            hidden_history=s_data["hidden_history"],
            vitals=s_data["vitals"],
            diagnosis=s_data["diagnosis"],
            available_investigations=s_data["available_investigations"],
            available_examinations=s_data["available_examinations"],
            expected_management=s_data["expected_management"],
            deterioration_rules=s_data["deterioration_rules"],
            recovery_rules=s_data["recovery_rules"]
        )
        db.add(scenario)
        db.commit()
        db.refresh(scenario)

    print(f"Successfully seeded {len(scenarios_data)} Informed Consent Scenarios into the database.")

if __name__ == "__main__":
    run_seed()
