import json
from typing import Tuple
from app.services.llm_service import _create_chat_completion

def classify_intent_and_extract_action(student_message: str) -> dict:
    """
    Uses LLM to classify the student's message into an intent.
    Returns a dict with 'intent' and optionally 'target'.
    """
    system_prompt = '''You are a clinical intent classifier.
Analyze the student's message and determine what clinical action they are actively performing.
Return ONLY a raw JSON object (no markdown) with this schema:
{
  "intent": "question" | "examination" | "investigation" | "treatment" | "diagnosis" | "general",
  "target": "string" // specific body part, test, or treatment if applicable, otherwise null
}

CRITICAL RULES:
- If the student is EXPLAINING, SUGGESTING, or DISCUSSING a treatment/procedure (e.g., "we need to do an amputation", "you will need surgery"), classify it as "general" or "question", NOT "treatment". 
- ONLY classify as "treatment" if the student explicitly states they are ADMINISTERING or PERFORMING it right now (e.g., "I am starting an IV", "I am applying a bandage").

Examples:
"I want to check your abdomen" -> {"intent": "examination", "target": "abdominal"}
"Order a CBC" -> {"intent": "investigation", "target": "CBC"}
"I am starting IV fluids now" -> {"intent": "treatment", "target": "IV fluids"}
"You will need to go to surgery" -> {"intent": "general", "target": null}
"How long have you had this pain?" -> {"intent": "question", "target": null}
"I think you have appendicitis" -> {"intent": "diagnosis", "target": "appendicitis"}
'''
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": student_message}
    ]
    
    try:
        response = _create_chat_completion(messages, temperature=0.1)
        response_text = response.choices[0].message.content
        
        # Strip markdown if present
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        action = json.loads(response_text)
        return action
    except Exception as e:
        # Fallback
        print(f"Classification error: {e}")
        return {"intent": "general", "target": None}

def resolve_clinical_action(action: dict, scenario_data: dict, current_state: dict) -> Tuple[str, dict]:
    """
    Processes the action against the scenario rules.
    Returns (system_action_text_to_show_student, action_data_json).
    """
    intent = action.get("intent")
    target = action.get("target")
    
    action_data = None
    system_message = None
    
    if intent == "investigation":
        target_normalized = str(target).lower().replace(" ", "_")
        available = scenario_data.get("available_investigations", {})
        
        # Simple string matching
        found_key = next((k for k in available.keys() if k.lower() in target_normalized or target_normalized in k.lower()), None)
        
        if found_key:
            results = available[found_key]
            system_message = f"Investigation Results: {found_key.upper()}"
            action_data = {"type": "investigation_result", "test": found_key, "results": results}
        else:
            system_message = f"System: Investigation '{target}' is not available or not indicated in this scenario."
            action_data = {"type": "investigation_result", "test": target, "results": "Unavailable"}
            
    elif intent == "examination":
        target_normalized = str(target).lower()
        available = scenario_data.get("available_examinations", {})
        
        found_key = next((k for k in available.keys() if k.lower() in target_normalized or target_normalized in k.lower()), None)
        
        if found_key:
            findings = available[found_key]
            system_message = f"Physical Examination: {found_key.capitalize()}"
            action_data = {"type": "examination_result", "exam": found_key, "findings": findings}
        else:
            # Fallback to general exam if they just say "examine patient"
            if "general" in available:
                findings = available["general"]
                system_message = f"Physical Examination: General"
                action_data = {"type": "examination_result", "exam": "general", "findings": findings}
            else:
                system_message = f"System: Examination '{target}' revealed no specific abnormalities."
                action_data = {"type": "examination_result", "exam": target, "findings": "Unremarkable"}
                
    elif intent == "treatment":
        if "treatments_given" not in current_state:
            current_state["treatments_given"] = []
        current_state["treatments_given"].append(target)
        
        applied_effect = None
        recovery_rules = scenario_data.get("recovery_rules", [])
        for rule in recovery_rules:
            if rule["trigger"].lower() in str(target).lower() or str(target).lower() in rule["trigger"].lower():
                applied_effect = rule["effect"]
                break
                
        if applied_effect:
            system_message = f"Treatment Administered: {target}"
            action_data = {"type": "treatment_effect", "treatment": target, "effect": applied_effect}
            current_state["recent_effect"] = applied_effect
        else:
            system_message = f"Treatment Administered: {target}"
            action_data = {"type": "treatment_effect", "treatment": target, "effect": "No immediate clinical change."}
            current_state["recent_effect"] = "No immediate clinical change."
            
    return system_message, action_data

def generate_patient_response(
    student_message: str, 
    scenario_data: dict, 
    current_state: dict, 
    chat_history: list,
    action: dict,
    system_action_text: str = None
) -> str:
    """
    Generates the patient's textual response using LLM, constrained by the scenario and current state.
    """
    profile = scenario_data.get("patient_profile", {})
    presentation = scenario_data.get("presentation", {})
    hidden = scenario_data.get("hidden_history", {})
    vitals = scenario_data.get("vitals", {})
    
    recent_effect = current_state.get("recent_effect", "")
    
    system_prompt = f"""You are a virtual patient simulation. You are ONLY the patient.
DO NOT break character. NEVER act as a nurse, tutor, or assistant. NEVER reveal your diagnosis.
If the student asks a question about an investigation result, say you don't know (you are a patient).

PATIENT PROFILE:
Name: {profile.get('name')}
Age: {profile.get('age')}
Personality/State: {profile.get('personality')}
Setting: {profile.get('setting')}

PRESENTATION (What you know):
{json.dumps(presentation, indent=2)}

HIDDEN HISTORY (Do not reveal unless specifically asked relevant questions):
{json.dumps(hidden, indent=2)}

CURRENT CLINICAL STATE:
Vitals (You don't know the exact numbers, but you feel the effects, e.g. feverish, fast heart beat): {json.dumps(vitals, indent=2)}
Treatments received: {current_state.get('treatments_given', [])}
Recent treatment effects on your body: {recent_effect}

RULES:
1. Reveal information PROGRESSIVELY. Answer only what is asked naturally.
2. Adopt your assigned personality, but be flexible and cooperative.
3. If the student explains a procedure, addresses your concerns, or reassures you, you MUST be convinced, agree, and give your consent. Do not be overly strict or stubborn. Once a reasonable explanation is given, accept it and move forward.
4. If the student asks for medical advice or asks what to do, remind them that they are the nurse and you are relying on them.
5. Keep responses short, natural, and conversational. NEVER use bullet points or numbered lists.
6. ASK ONLY ONE CONCERN OR QUESTION AT A TIME. Wait for the nurse to answer before asking the next one.
7. CRITICAL: Carefully read the chat history. NEVER repeat a question or concern that the nurse has already addressed.
"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history
    for msg in chat_history:
        role = "assistant" if msg["sender"] == "bot" else "user"
        # Only pass textual messages to the LLM (ignore system actions)
        if msg["message_text"]:
            messages.append({"role": role, "content": msg["message_text"]})
        
    prompt_modifier = student_message
    if action["intent"] == "treatment" and system_action_text:
        prompt_modifier = f"[The student just administered: {action['target']}. React naturally based on the 'Recent treatment effects' in your system prompt. Also they said: {student_message}]"
    elif action["intent"] in ["examination", "investigation"]:
        prompt_modifier = f"[The student is performing/ordering: {action['target']}. Wait for them to ask you something, or just acknowledge it briefly as a patient. Also they said: {student_message}]"
    elif action["intent"] == "diagnosis":
        prompt_modifier = f"[The student just gave a diagnosis: {student_message}. React as a normal patient hearing this.]"

    messages.append({"role": "user", "content": prompt_modifier})

    response = _create_chat_completion(messages, temperature=0.3)
    patient_reply = response.choices[0].message.content
    
    # Clear the temporary recent effect from state
    if "recent_effect" in current_state:
        del current_state["recent_effect"]
        
    return patient_reply

def process_student_message(
    student_message: str, 
    scenario_data: dict, 
    current_state: dict, 
    chat_history: list
) -> Tuple[str, dict, dict]:
    """
    Main entry point for the simulation engine.
    """
    action = classify_intent_and_extract_action(student_message)
    system_action_text, action_data = resolve_clinical_action(action, scenario_data, current_state)
    
    patient_reply = generate_patient_response(
        student_message, 
        scenario_data, 
        current_state, 
        chat_history,
        action,
        system_action_text
    )
    
    return patient_reply, action_data, current_state
