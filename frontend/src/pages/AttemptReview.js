import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttemptReview } from '../api';
import { FiArrowLeft } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const formatSriLankanTime = (timestamp) => {
  if (!timestamp) return '';
  const dateStr = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
  return new Date(dateStr).toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: 'short', timeStyle: 'short' });
};

function AttemptReview() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const fetchReview = async () => {
    try {
      const res = await getAttemptReview(attemptId);
      setAttempt(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading review...</div>;
  }

  if (!attempt) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Failed to load review details.</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', padding: '0.5rem' }}
        >
          <FiArrowLeft />
        </button>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Assessment Review: {attempt.source_context.title}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Student: {attempt.student} • Completed: {formatSriLankanTime(attempt.timestamp)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        {/* Source Context */}
        <div style={{ flex: '1 1 300px', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: '600px' }}>
          <h4 style={{ marginTop: 0, color: 'var(--accent-color)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            Source Context
          </h4>
          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{attempt.source_context.title}</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{attempt.source_context.description}</p>
          </div>
        </div>

        {/* Chat Transcript */}
        <div style={{ flex: '1 1 300px', padding: '1.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: '600px' }}>
          <h4 style={{ marginTop: 0, color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            Chat Transcript
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {attempt.transcript.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : msg.sender === 'system' ? 'center' : 'flex-start', maxWidth: msg.sender === 'system' ? '95%' : '90%' }}>
                {msg.sender === 'user' ? (
                  <div style={{ background: 'var(--accent-color)', color: 'white', padding: '0.8rem 1rem', borderRadius: '16px 16px 4px 16px', fontSize: '0.9rem' }}>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                  </div>
                ) : msg.sender === 'system' ? (
                  <div style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '0.8rem 1rem', borderRadius: '16px 16px 16px 4px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {msg.action_data && (
                      <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--accent-color)' }}>ACTION:</strong> {JSON.stringify(msg.action_data)}
                      </div>
                    )}
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                    {msg.media_url && (
                      <img src={`${API_URL}${msg.media_url}`} alt="Attached media" style={{ maxWidth: '100%', marginTop: '0.5rem', borderRadius: '4px' }} />
                    )}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textAlign: msg.sender === 'user' ? 'right' : msg.sender === 'system' ? 'center' : 'left' }}>
                  {formatSriLankanTime(msg.timestamp)}
                </div>
              </div>
            ))}
            {attempt.transcript.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No messages in this attempt.</p>
            )}
          </div>
        </div>
      </div>

      {attempt.ai_feedback && (
        <div className="neu-convex" style={{ padding: '2rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)' }}>
          <h4 style={{ marginTop: 0, color: 'var(--accent-color)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            Evaluation Report
          </h4>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <ReactMarkdown>{attempt.ai_feedback}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttemptReview;
