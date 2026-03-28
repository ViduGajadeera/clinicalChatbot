import axios from "axios";

const API =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export const sendMessage = (input) =>
  axios.post(`${API}/chat/`, { user_input: input });

export const evaluateAnswer = (student, expected) =>
  axios.post(`${API}/evaluate`, {
    student_answer: student,
    expected_answer: expected,
  });