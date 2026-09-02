import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { startAttempt } from '../api';
import { FiLogOut, FiPlayCircle, FiUser, FiSettings } from 'react-icons/fi';
import { MdSpaceDashboard } from 'react-icons/md';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return null;

  const handleTestChatbot = async () => {
    try {
      const res = await startAttempt();
      navigate(`/chat/${res.data.attempt_id}`);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        alert("No scenarios are available. Please upload a scenario document first.");
      } else {
        alert("An error occurred while starting the chatbot test. Please try again.");
      }
    }
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 2rem', 
      marginBottom: '2rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }} className="neu-convex">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--accent-shadow)' }}>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>K</span>
        </div>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          KIU <span style={{ color: 'var(--text-secondary)' }}>AI</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
          <MdSpaceDashboard /> Dashboard
        </Link>
        
        {user.role === 'lecturer' && (
          <button 
            onClick={handleTestChatbot}
            style={{ 
              background: 'transparent', 
              color: 'var(--text-primary)', 
              fontWeight: '500', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '1rem',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent-color)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          >
            <FiPlayCircle /> Test Chatbot
          </button>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <FiUser /> {user.email}
          </div>
          <Link to="/settings" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }} title="Settings">
            <FiSettings size={18} />
          </Link>
          <button onClick={logout} className="neu-button-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            <FiLogOut /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
