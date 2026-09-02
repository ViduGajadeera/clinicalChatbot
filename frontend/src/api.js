import axios from "axios";

const API = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

// Axios instance with interceptor for auth token
const apiClient = axios.create({
  baseURL: API
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  return axios.post(`${API}/auth/login`, formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
};

export const register = (userData) => axios.post(`${API}/auth/register`, userData);

export const startAttempt = () => apiClient.post('/chat/start');
export const getChatHistory = (attemptId) => apiClient.get(`/chat/${attemptId}/history`);
export const submitMessage = (attemptId, messageText) => 
  apiClient.post('/chat/message', { attempt_id: attemptId, message_text: messageText });

export const getStudentAttempts = () => apiClient.get('/student/attempts');
export const getLecturerStudents = () => apiClient.get('/lecturer/students');
export const getStudentProgress = (studentId) => apiClient.get(`/lecturer/students/${studentId}/progress`);
export const getAttemptDetails = (attemptId) => apiClient.get(`/lecturer/attempts/${attemptId}`);

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post('/documents/upload', formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const getDocuments = () => apiClient.get('/documents/');
export const deleteDocument = (id) => apiClient.delete(`/documents/${id}`);

export const getProfile = () => apiClient.get('/auth/me');
export const updateMyPassword = (oldPassword, newPassword) => 
  apiClient.post('/auth/reset-password', { old_password: oldPassword, new_password: newPassword });

export const deleteStudent = (studentId) => apiClient.delete(`/lecturer/students/${studentId}`);
export const resetStudentPassword = (studentId, newPassword) => 
  apiClient.post('/auth/admin/reset-student-password', { student_id: studentId, new_password: newPassword });