from app.services.llm_service import generate_response

def evaluate_answer(student, expected):
    prompt = f"""
You are a strict nursing lecturer.

Evaluate the student's answer based on the expected answer.

Return the response STRICTLY in the following format:

Score: <number>/10

Clinical Reasoning:
- Point 1
- Point 2
- Point 3
/n

Missing Points:
- Point 1
- Point 2
- Point 3
/n
Correct Explanation:
- Point 1
- Point 2
- Point 3

Rules:
- Use bullet points only (no paragraphs)
- Keep each point short and clear (1-2 lines max)
- Be concise and structured
- Do not add extra text outside this format

Expected Answer:
{expected}

Student Answer:
{student}
"""

    return generate_response(prompt)