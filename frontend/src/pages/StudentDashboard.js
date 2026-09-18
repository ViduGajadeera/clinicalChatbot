import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentAttempts, startAttempt, getScenarios } from '../api';
import { AuthContext } from '../context/AuthContext';
import { FiPlay, FiClock, FiCheckCircle, FiChevronRight, FiFilter } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const formatSriLankanTime = (timestamp) => {
  if (!timestamp) return '';
  const dateStr = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
  return new Date(dateStr).toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: 'short', timeStyle: 'short' });
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: 'var(--bg-color)', padding: '1rem', border: '1px solid var(--accent-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{data.fullTitle}</p>
        <p style={{ margin: '0 0 0.5rem 0' }}>Score: <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{data.score}</span></p>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatSriLankanTime(data.timestamp)}</p>
      </div>
    );
  }
  return null;
};

const StudentDashboard = () => {
  const [attempts, setAttempts] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioFilter, setSelectedScenarioFilter] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAttempts();
    fetchScenarios();
  }, []);

  const fetchAttempts = async () => {
    try {
      const res = await getStudentAttempts();
      setAttempts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchScenarios = async () => {
    try {
      const res = await getScenarios();
      setScenarios(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartAttempt = async (scenarioId) => {
    try {
      const res = await startAttempt(scenarioId);
      navigate(`/chat/${res.data.attempt_id}`);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        alert("Scenario not found. Please try again.");
      } else {
        alert("An error occurred while starting the assessment. Please try again.");
      }
    }
  };

  const uniqueScenarios = Array.from(new Set(attempts.map(a => a.scenario_title))).filter(Boolean);

  const chartData = attempts
    .filter(a => a.score !== null && a.score !== undefined)
    .filter(a => selectedScenarioFilter ? a.scenario_title === selectedScenarioFilter : true)
    .map((a, i) => ({
      name: `Attempt ${i + 1}`,
      fullTitle: a.scenario_title,
      score: a.score,
      timestamp: a.timestamp
    }));

  return (
    <div style={{ width: '100%', paddingBottom: '4rem' }} className="animate-fade-in">
      
      {/* Hero Section */}
      <div className="neu-convex" style={{ padding: '3rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'linear-gradient(145deg, var(--bg-color), rgba(255,82,82,0.05))' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', wordBreak: 'break-word' }}>Welcome back, <span style={{ color: 'var(--accent-color)' }}>{user?.email?.split('@')[0]}</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', margin: 0 }}>Select a clinical scenario below to start a 20-minute role-play assessment.</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {scenarios.map(s => (
            <div key={s.id} className="neu-convex" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem', display: 'block', marginBottom: '0.5rem' }}>{s.title}</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.description}</p>
              </div>
              <button onClick={() => handleStartAttempt(s.id)} className="neu-button-accent" style={{ padding: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '30px', marginTop: 'auto' }}>
                <FiPlay fill="currentColor" /> Start Scenario
              </button>
            </div>
          ))}
          {scenarios.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No scenarios available.</p>
          )}
        </div>
      </div>

      <div className="responsive-grid responsive-grid-2-1">
        {/* Left Column */}
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
          
          <div className="neu-convex" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Chat History</h3>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', maxHeight: '400px' }}>
              {attempts.length === 0 ? (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Complete an assessment to see your history!
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {attempts.slice().reverse().map(attempt => (
                    <li 
                      key={attempt.attempt_id} 
                      onClick={() => navigate(attempt.score !== null ? `/review/${attempt.attempt_id}` : `/chat/${attempt.attempt_id}`)}
                      style={{ 
                        padding: '1.5rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <FiCheckCircle color="var(--accent-color)" size={20} />
                          <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{attempt.scenario_title}</strong>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', marginLeft: '2.5rem' }}>
                          {formatSriLankanTime(attempt.timestamp)}
                        </div>
                        {attempt.score !== null && (
                          <div style={{ color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.5rem', marginLeft: '2.5rem' }}>
                            Score: {attempt.score}/100
                          </div>
                        )}
                      </div>
                      <div style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}>
                        <FiChevronRight />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="neu-convex" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Performance Progress</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FiFilter color="var(--text-secondary)" />
              <select
                value={selectedScenarioFilter}
                onChange={(e) => setSelectedScenarioFilter(e.target.value)}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}>All Scenarios</option>
                {uniqueScenarios.map((title, idx) => (
                  <option key={idx} value={title} style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                    {title.length > 30 ? title.substring(0, 30) + '...' : title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ flex: 1, minHeight: '400px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                  <YAxis domain={[0, 100]} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#4caf50' : entry.score >= 50 ? 'var(--accent-color)' : '#f44336'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No graded assessments to display yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

