from openai import APIError, OpenAI

from app.config import GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url=GROQ_BASE_URL,
)


def _create_chat_completion(messages, temperature: float):
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to backend/.env (https://console.groq.com/keys)."
        )
    return client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=temperature,
    )


def build_messages(scenario, history, user_input):
    messages = []

    # 🧠 SYSTEM ROLE (VERY IMPORTANT)
    system_prompt = f"""
You are an intelligent and engaging nursing lecturer chatbot.

Your goals:
- Teach students using clinical scenarios
- Improve their decision-making skills
- Ask questions step-by-step (like a viva exam)
- Be conversational like ChatGPT (friendly, human-like)

RULES:
- Ask ONLY ONE question at a time
- Do NOT repeat the same question
- If student is correct → appreciate and move forward
- If wrong → guide with hints (do NOT give full answer immediately)
- Encourage critical thinking
- Keep conversation natural and engaging
- Occasionally use friendly tone (e.g., "Good thinking 👍")

SCENARIO:
Title: {scenario.title}
Description: {scenario.description}

QUESTIONS TO COVER:
{[(q.question, q.expected_answer) for q in scenario.questions]}
"""

    messages.append({"role": "system", "content": system_prompt})

    # 📜 Add history
    for h in history:
        messages.append({"role": "user", "content": h["user"]})
        messages.append({"role": "assistant", "content": h["bot"]})

    # 👤 Current user input
    messages.append({"role": "user", "content": user_input})

    return messages


def generate_chat_response(scenario, history, user_input):
    messages = build_messages(scenario, history, user_input)
    try:
        response = _create_chat_completion(messages, temperature=0.7)
        return response.choices[0].message.content
    except APIError as exc:
        code = getattr(exc, "status_code", None)
        prefix = f"Chat service error ({code}): " if code else "Chat service error: "
        return f"{prefix}{exc.message}"
    except Exception as exc:
        return f"Chat service error: {exc}"


def generate_response(prompt: str):
    try:
        response = _create_chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        return response.choices[0].message.content
    except APIError as exc:
        code = getattr(exc, "status_code", None)
        prefix = f"Evaluation service error ({code}): " if code else "Evaluation service error: "
        return f"{prefix}{exc.message}"
    except Exception as exc:
        return f"Evaluation service error: {exc}"
