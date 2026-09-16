import React, { useEffect, useState, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getLecturerStudents, getStudentProgress, getAttemptDetails, getKpis, getScenarios, startAttempt } from '../api';
import { FiUsers, FiActivity, FiChevronRight, FiCheckCircle, FiPlay } from 'react-icons/fi';
import { ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

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

const LecturerDashboard = () => {
  useContext(AuthContext);
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [studentFilter, setStudentFilter] = useState('');
  const [kpis, setKpis] = useState([]);
  
  // Test Chatbot State
  const [scenarios, setScenarios] = useState([]);
  const [testScenarioId, setTestScenarioId] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchKpis();
    fetchScenarios();
  }, []);

  const fetchStudents = async () => {
    const res = await getLecturerStudents();
    setStudents(res.data);
  };
  
  const fetchKpis = async () => {
    try {
      const res = await getKpis();
      setKpis(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchScenarios = async () => {
    try {
      const res = await getScenarios();
      setScenarios(res.data);
      if (res.data.length > 0) {
        setTestScenarioId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestChatbot = async () => {
    if (!testScenarioId) return;
    try {
      const res = await startAttempt(testScenarioId);
      navigate(`/chat/${res.data.attempt_id}`);
    } catch (err) {
      console.error(err);
      alert("An error occurred while starting the test scenario.");
    }
  };

  const handleViewProgress = async (studentId) => {
    const res = await getStudentProgress(studentId);
    setStudentProgress(res.data);
    setSelectedStudent(studentId);
    setSelectedAttempt(null);
  };

  const handleViewAttempt = async (attemptId) => {
    const res = await getAttemptDetails(attemptId);
    setSelectedAttempt(res.data);
  };

  const totalAttempts = students.reduce((sum, s) => sum + s.attempts_count, 0);

  const filteredStudents = studentFilter 
    ? students.filter(s => s.id.toString() === studentFilter) 
    : students;

  const chartData = studentProgress
    .filter(p => p.score !== null && p.score !== undefined)
    .map(p => ({
      name: p.scenario_title.length > 15 ? p.scenario_title.substring(0, 15) + '...' : p.scenario_title,
      fullTitle: p.scenario_title,
      score: p.score,
      timestamp: p.timestamp
    }));

  return (
    <div style={{ width: '100%', padding: '0 2rem 4rem 2rem' }} className="animate-fade-in">
      
      {/* Top Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Lecturer Dashboard</h2>
        
        {/* Test Chatbot Controls */}
        <div className="neu-convex" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '30px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Test Scenario:</span>
          <select
            value={testScenarioId}
            onChange={(e) => setTestScenarioId(e.target.value)}
            style={{
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            {scenarios.map(s => (
              <option key={s.id} value={s.id} style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                {s.title}
              </option>
            ))}
          </select>
          <button onClick={handleTestChatbot} className="neu-button-accent" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}>
            <FiPlay /> Test Chatbot
          </button>
        </div>
      </div>

      {/* Top Main KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="neu-convex" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,82,82,0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-color)', fontSize: '1.5rem' }}>
            <FiUsers />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Total Students</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{students.length}</div>
          </div>
        </div>

        <div className="neu-convex" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,82,82,0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-color)', fontSize: '1.5rem' }}>
            <FiActivity />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Total Assessments</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalAttempts}</div>
          </div>
        </div>
      </div>

      <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Scenario Engagements</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} className="neu-convex" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--accent-color)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{kpi.count}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.3' }}>{kpi.title}</div>
          </div>
        ))}
      </div>

      <div className="neu-convex" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Highest marks for the scenarios</h3>
        {kpis.length > 0 ? (
          <div style={{ width: '100%', height: 450 }}>
            <ResponsiveContainer>
              <BarChart data={kpis} margin={{ top: 20, right: 20, bottom: 80, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="title" 
                  stroke="var(--text-secondary)" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                />
                <YAxis type="number" domain={[0, 100]} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0f1115', border: '1px solid var(--accent-color)', borderRadius: '8px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--accent-color)' }} />
                <Bar dataKey="max_score" name="Highest Score" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No data available yet.</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', marginBottom: '3rem' }}>
        <section className="neu-convex" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiUsers /> Student Roster
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}>All Students</option>
              {students.map(s => (
                <option key={s.id} value={s.id} style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '600px', overflowY: 'auto' }}>
            {filteredStudents.map(student => (
              <li 
                key={student.id} 
                style={{ 
                  padding: '1rem', 
                  borderBottom: '1px solid rgba(255,255,255,0.1)', 
                  cursor: 'pointer', 
                  background: selectedStudent === student.id ? 'var(--shadow-light)' : 'transparent',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s'
                }} 
                onClick={() => handleViewProgress(student.id)}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{student.name}</strong><br/>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{student.attempts_count} attempts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <FiChevronRight color="var(--text-secondary)" />
                </div>
              </li>
            ))}
            {filteredStudents.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>No students found.</p>
            )}
          </ul>
        </section>

        {/* Right Pane */}
        <div>
          {selectedStudent ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Graph Panel */}
              <div className="neu-convex" style={{ padding: '2rem' }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Scenario Scores</h3>
                {chartData.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="category" dataKey="name" name="Scenario" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <YAxis type="number" dataKey="score" name="Score" domain={[0, 100]} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                        <ZAxis range={[100, 100]} />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Attempts" data={chartData} fill="var(--accent-color)" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No scored attempts yet.</div>
                )}
              </div>

              {/* Attempt History List */}
              <div className="neu-convex" style={{ padding: '2rem' }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Assessment History</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {studentProgress.map(prog => (
                    <div key={prog.attempt_id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <FiCheckCircle color="var(--accent-color)" size={20} style={{ marginTop: '0.2rem' }} />
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{prog.scenario_title}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{formatSriLankanTime(prog.timestamp)}</div>
                          {prog.score !== null && <div style={{ color: 'var(--accent-color)', fontWeight: 'bold', marginTop: '0.5rem' }}>Score: {prog.score}</div>}
                        </div>
                      </div>
                      <button onClick={() => handleViewAttempt(prog.attempt_id)} className="neu-button" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: '100%' }}>View Transcript</button>
                    </div>
                  ))}
                  {studentProgress.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)' }}>No assessments completed yet.</p>
                  )}
                </div>
              </div>

              {/* Attempt Details */}
              {selectedAttempt && (
                <div className="neu-convex animate-fade-in" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: '600px' }}>
                      <h4 style={{ marginTop: 0, color: 'var(--accent-color)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        Source Context
                      </h4>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{selectedAttempt.source_context.title}</strong>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{selectedAttempt.source_context.description}</p>
                      </div>
                    </div>

                    <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: '600px' }}>
                      <h4 style={{ marginTop: 0, color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        Chat Transcript
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {selectedAttempt.transcript.map((msg, idx) => (
                          <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                            {msg.sender === 'user' ? (
                              <div style={{ background: 'var(--accent-color)', color: 'white', padding: '0.8rem 1rem', borderRadius: '16px 16px 4px 16px', fontSize: '0.9rem' }}>
                                {msg.text}
                              </div>
                            ) : (
                              <div style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '0.8rem 1rem', borderRadius: '16px 16px 16px 4px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {msg.text}
                                {msg.media_url && (
                                  <img src={`${API_URL}${msg.media_url}`} alt="Attached media" style={{ maxWidth: '100%', marginTop: '0.5rem', borderRadius: '4px' }} />
                                )}
                              </div>
                            )}
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                              {formatSriLankanTime(msg.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedAttempt.ai_feedback && (
                    <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ marginTop: 0, color: 'var(--accent-color)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        Evaluation Report
                      </h4>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        <ReactMarkdown>{selectedAttempt.ai_feedback}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', minHeight: '300px' }}>
              Select a student to view their assessment scores and history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
