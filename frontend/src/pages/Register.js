import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="neu-convex" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-primary)' }}>Register</h2>
        {error && <div style={{ color: 'var(--accent-color)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required className="neu-input" />
          <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required className="neu-input" />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="neu-input" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="neu-input" />
          <select name="role" value={formData.role} onChange={handleChange} className="neu-input">
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
          </select>
          <button type="submit" className="neu-button-accent">
            Register
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)' }}>Already have an account? <span style={{color: 'var(--accent-color)'}}>Login</span></Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
