import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { login as loginApi } from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginApi(email, password);
      login(response.data.access_token, response.data.role);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="neu-convex" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-primary)' }}>CLINICAL AI AGENT</h2>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-primary)' }}>Login</h2>
        {error && <div style={{ color: 'var(--accent-color)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="neu-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="neu-input"
          />
          <button type="submit" className="neu-button-accent">
            Login
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/register" style={{ color: 'var(--text-secondary)' }}>Don't have an account? <span style={{ color: 'var(--accent-color)' }}>Register</span></Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
