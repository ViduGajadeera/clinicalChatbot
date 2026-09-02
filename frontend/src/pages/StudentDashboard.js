import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentAttempts, startAttempt } from '../api';
import { AuthContext } from '../context/AuthContext';
import { FiPlay, FiClock, FiCheckCircle } from 'react-icons/fi';

const StudentDashboard = () => {
  const [attempts, setAttempts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const res = await getStudentAttempts();
      setAttempts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartAttempt = async () => {
    try {
      const res = await startAttempt();
      navigate(`/chat/${res.data.attempt_id}`);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        alert("No scenarios are available. Please ask a lecturer to upload a scenario first.");
      } else {
        alert("An error occurred while starting the assessment. Please try again.");
      }
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }} className="animate-fade-in">
      
      {/* Hero Section */}
      <div className="neu-convex" style={{ padding: '3rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(145deg, var(--bg-color), rgba(255,82,82,0.05))' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2.5rem' }}>Welcome back, <span style={{ color: 'var(--accent-color)' }}>{user?.email?.split('@')[0]}</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>Ready for your next clinical assessment scenario?</p>
        </div>
        <button onClick={handleStartAttempt} className="neu-button-accent glow-button" style={{ padding: '1rem 2rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '30px' }}>
          <FiPlay fill="currentColor" /> Start New Assessment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Stats Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="neu-convex" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '50%', color: 'var(--text-primary)', fontSize: '2rem' }}>
              <FiClock />
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total Assessments</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{attempts.length}</div>
            </div>
          </div>
        </div>

        {/* History Column */}
        <div className="neu-convex" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 2rem 0', color: 'var(--text-primary)' }}>Chat History</h3>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>
            {attempts.length === 0 ? (
              <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Complete an assessment to see your history!
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {attempts.map(attempt => (
                  <li key={attempt.attempt_id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <FiCheckCircle color="var(--accent-color)" size={20} />
                      <span style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{new Date(attempt.timestamp).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
