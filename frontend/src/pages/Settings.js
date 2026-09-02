import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getProfile, updateMyPassword, getLecturerStudents, deleteStudent, resetStudentPassword } from '../api';
import { FiUser, FiLock, FiTrash2, FiRefreshCcw, FiUsers } from 'react-icons/fi';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  
  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  
  // Student Reset Password State
  const [studentPasswords, setStudentPasswords] = useState({});
  const [studentMsgs, setStudentMsgs] = useState({});

  useEffect(() => {
    fetchProfile();
    if (user?.role === 'lecturer') {
      fetchStudents();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await getLecturerStudents();
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await updateMyPassword(oldPassword, newPassword);
      setPasswordMsg('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMsg(err.response?.data?.detail || 'Failed to update password');
    }
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure? This will permanently delete the student and all their attempts.")) return;
    try {
      await deleteStudent(studentId);
      fetchStudents(); // refresh
    } catch (err) {
      alert("Failed to delete student");
    }
  };

  const handleResetStudentPassword = async (studentId) => {
    const newPass = studentPasswords[studentId];
    if (!newPass) return;
    
    try {
      await resetStudentPassword(studentId, newPass);
      setStudentMsgs({ ...studentMsgs, [studentId]: 'Success!' });
      setStudentPasswords({ ...studentPasswords, [studentId]: '' });
    } catch (err) {
      setStudentMsgs({ ...studentMsgs, [studentId]: 'Failed' });
    }
    setTimeout(() => {
      setStudentMsgs(prev => ({ ...prev, [studentId]: '' }));
    }, 3000);
  };

  if (!profile) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }} className="animate-fade-in">
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Account Settings</h2>

      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Profile Info (Read Only) */}
        <section className="neu-convex" style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiUser /> Personal Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>First Name</label>
              <div className="neu-concave" style={{ padding: '0.75rem', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                {profile.first_name}
              </div>
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Last Name</label>
              <div className="neu-concave" style={{ padding: '0.75rem', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                {profile.last_name}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email Address</label>
              <div className="neu-concave" style={{ padding: '0.75rem', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                {profile.email}
              </div>
            </div>
          </div>
        </section>

        {/* Change Own Password */}
        <section className="neu-convex" style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiLock /> Change Password
          </h3>
          <form onSubmit={handleUpdatePassword} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Password</label>
              <input 
                type="password" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="neu-concave"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>New Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="neu-concave"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="neu-button-accent" style={{ padding: '0.75rem 2rem' }}>Update Password</button>
              {passwordMsg && <span style={{ color: 'var(--accent-color)' }}>{passwordMsg}</span>}
            </div>
          </form>
        </section>

        {/* Lecturer Only: Student Management */}
        {user?.role === 'lecturer' && (
          <section className="neu-convex" style={{ padding: '2rem' }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiUsers /> Student Management
            </h3>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {students.map(student => (
                <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{student.name}</strong><br/>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{student.email}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        value={studentPasswords[student.id] || ''}
                        onChange={(e) => setStudentPasswords({ ...studentPasswords, [student.id]: e.target.value })}
                        className="neu-concave"
                        style={{ padding: '0.5rem', border: 'none', color: 'var(--text-primary)', width: '150px' }}
                      />
                      <button 
                        onClick={() => handleResetStudentPassword(student.id)}
                        className="neu-button"
                        style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Reset Student's Password"
                      >
                        <FiRefreshCcw /> Reset
                      </button>
                      {studentMsgs[student.id] && <span style={{ color: '#4CAF50', fontSize: '0.8rem' }}>{studentMsgs[student.id]}</span>}
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteStudent(student.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}
                      title="Delete Student"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
              {students.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No students found.</p>}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Settings;
