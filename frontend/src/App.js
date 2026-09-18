import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import ChatSession from './pages/ChatSession';
import AttemptReview from './pages/AttemptReview';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

import './App.css';
import './index.css';

import Reports from './pages/Reports';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return (
    <>
      <Navbar />
      <div className="page-container">
        {children}
      </div>
    </>
  );
};

const DefaultRedirect = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" />;
  if (user.role === 'lecturer') return <Navigate to="/lecturer/dashboard" />;
  return <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/chat/:attemptId" element={
            <ProtectedRoute allowedRoles={['student', 'lecturer']}>
              <ChatSession />
            </ProtectedRoute>
          } />

          <Route path="/review/:attemptId" element={
            <ProtectedRoute allowedRoles={['student', 'lecturer']}>
              <AttemptReview />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['student', 'lecturer']}>
              <Settings />
            </ProtectedRoute>
          } />
          
          <Route path="/lecturer/dashboard" element={
            <ProtectedRoute allowedRoles={['lecturer']}>
              <LecturerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/lecturer/reports" element={
            <ProtectedRoute allowedRoles={['lecturer']}>
              <Reports />
            </ProtectedRoute>
          } />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;