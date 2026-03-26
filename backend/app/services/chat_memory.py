chat_sessions = {}

def get_history(session_id):
    return chat_sessions.get(session_id, [])

def update_history(session_id, user, bot):
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []

    chat_sessions[session_id].append({
        "user": user,
        "bot": bot
    })