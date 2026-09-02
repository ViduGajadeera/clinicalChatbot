import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { uploadDocument, getDocuments, deleteDocument, getLecturerStudents, getStudentProgress, getAttemptDetails } from '../api';
import { FiUploadCloud, FiTrash2, FiUsers, FiFileText, FiActivity, FiChevronRight, FiCheckCircle } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const LecturerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => {
    fetchDocuments();
    fetchStudents();
  }, []);

  const fetchDocuments = async () => {
    const res = await getDocuments();
    setDocuments(res.data);
  };

  const fetchStudents = async () => {
    const res = await getLecturerStudents();
    setStudents(res.data);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadStatus('Uploading...');
    try {
      await uploadDocument(selectedFile);
      setUploadStatus('Upload successful!');
      setSelectedFile(null);
      fetchDocuments();
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (err) {
      setUploadStatus('Upload failed.');
    }
  };

  const handleDeleteDoc = async (id) => {
    await deleteDocument(id);
    fetchDocuments();
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }} className="animate-fade-in">
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="neu-convex" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255,82,82,0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-color)', fontSize: '2rem' }}>
            <FiUsers />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Students</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{students.length}</div>
          </div>
        </div>

        <div className="neu-convex" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255,82,82,0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-color)', fontSize: '2rem' }}>
            <FiFileText />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Scenarios Uploaded</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{documents.length}</div>
          </div>
        </div>

        <div className="neu-convex" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255,82,82,0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-color)', fontSize: '2rem' }}>
            <FiActivity />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Assessments Completed</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalAttempts}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        <section className="neu-convex" style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiFileText /> Manage Documents
          </h3>
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input 
              type="file" 
              accept=".docx" 
              onChange={handleFileChange} 
              style={{ color: 'var(--text-primary)', flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} 
            />
            <button onClick={handleUpload} className="neu-button-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiUploadCloud /> Upload
            </button>
          </div>
          {uploadStatus && <div style={{ marginBottom: '1rem', color: 'var(--accent-color)', fontSize: '0.9rem' }}>{uploadStatus}</div>}
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--text-secondary)', color: 'var(--text-secondary)' }}>Filename</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--text-secondary)', color: 'var(--text-secondary)' }}>Upload Date</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--text-secondary)', color: 'var(--text-secondary)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{doc.filename}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{new Date(doc.upload_date).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={() => handleDeleteDoc(doc.id)} style={{ color: 'var(--text-secondary)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No documents uploaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="neu-convex" style={{ padding: '2rem' }}>
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

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '330px', overflowY: 'auto' }}>
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
      </div>

      {selectedStudent && (
        <section className="neu-convex animate-fade-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-color)' }}>Student Assessments</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h4 style={{ color: 'var(--text-primary)' }}>Assessment History</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {studentProgress.map(prog => (
                  <li key={prog.attempt_id} style={{ padding: '1.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <FiCheckCircle color="var(--accent-color)" size={20} />
                      <span style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{new Date(prog.timestamp).toLocaleString()}</span>
                    </div>
                    <button onClick={() => handleViewAttempt(prog.attempt_id)} className="neu-button" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>View Transcript</button>
                  </li>
                ))}
                {studentProgress.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)' }}>No assessments completed yet.</p>
                )}
              </ul>
            </div>

            <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {selectedAttempt ? (
                <div className="animate-fade-in" style={{ display: 'flex', gap: '1.5rem' }}>
                  
                  {/* Source Context Panel */}
                  <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: '600px' }}>
                    <h4 style={{ marginTop: 0, color: 'var(--accent-color)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                      Source Context
                    </h4>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{selectedAttempt.source_context.title}</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{selectedAttempt.source_context.description}</p>
                    </div>
                    
                    <h5 style={{ color: 'var(--text-primary)', marginTop: '2rem' }}>Expected Q&A</h5>
                    {selectedAttempt.source_context.questions.map((q, idx) => (
                      <div key={idx} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Q{idx + 1}: {q.text}</p>
                        <p style={{ color: '#4CAF50', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Expected: {q.expected}</p>
                        {q.media && q.media.length > 0 && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            Images: {q.media.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Transcript Panel */}
                  <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: '600px' }}>
                    <h4 style={{ marginTop: 0, color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                      Chat Transcript
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {selectedAttempt.transcript.map((msg, idx) => (
                        <div key={idx} style={{ 
                          alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '90%'
                        }}>
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
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', minHeight: '300px' }}>
                  Select an assessment to view the transcript.
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default LecturerDashboard;
