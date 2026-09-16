import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from "react-router-dom";
import { getChatHistory, submitMessage, evaluateAttempt } from "../api";
import { FiArrowLeft, FiSend, FiClock, FiCheckCircle, FiStopCircle } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const formatSriLankanTime = (timestamp) => {
  if (!timestamp) return '';
  const dateStr = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
  return new Date(dateStr).toLocaleString("en-GB", { timeZone: "Asia/Colombo", timeStyle: 'short' });
};

function ChatSession() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  const messagesEndRef = useRef(null);

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Timer logic
  useEffect(() => {
    if (!initialLoadDone || isCompleted || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [initialLoadDone, isCompleted, timeLeft]);

  // Trigger evaluation when time runs out or completed
  useEffect(() => {
    if (initialLoadDone && timeLeft <= 0 && !isCompleted) {
      handleSessionComplete();
    }
  }, [timeLeft, initialLoadDone]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getChatHistory(attemptId);
      setMessages(res.data.messages || []);
      
      if (res.data.time_left !== undefined) {
        setTimeLeft(res.data.time_left);
      }
      
      if (res.data.is_completed) {
        setIsCompleted(true);
        if (res.data.ai_feedback) {
          setFeedback(res.data.ai_feedback);
        } else {
          fetchFeedback();
        }
      }
    } catch (err) {
      console.error(err);
      setMessages([{ text: "Error fetching chat history.", sender: "bot" }]);
    }
    setLoading(false);
    setInitialLoadDone(true);
  };

  const fetchFeedback = async () => {
    try {
      const res = await evaluateAttempt(attemptId);
      setFeedback(res.data.feedback);
    } catch (err) {
      console.error("Failed to generate feedback", err);
    }
  };

  const handleSessionComplete = async () => {
    setIsCompleted(true);
    await fetchFeedback();
  };
  
  const handleManualEnd = () => {
    if (window.confirm("Are you sure you want to end the session early? This will finalize your assessment.")) {
      handleSessionComplete();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isCompleted || timeLeft <= 0) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await submitMessage(attemptId, userMessage);
      
      if (res.data.bot_reply) {
        setMessages((prev) => [
          ...prev,
          { text: res.data.bot_reply, sender: "bot", media_url: res.data.media_url }
        ]);
      }
      
      if (res.data.is_completed) {
        handleSessionComplete();
      } else if (res.data.error && res.data.is_completed) {
        // Handled server-side timeout or already completed error
        handleSessionComplete();
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { text: "Error submitting message.", sender: "bot" }
      ]);
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', height: '85vh', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/student/dashboard')} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '1.5rem', padding: '0.5rem', marginRight: '1rem' }}
          >
            <FiArrowLeft />
          </button>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>Clinical Scenario Assessment</h3>
            <span style={{ color: isCompleted ? 'var(--text-secondary)' : 'var(--accent-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: isCompleted ? 'var(--text-secondary)' : 'var(--accent-color)', borderRadius: '50%', boxShadow: isCompleted ? 'none' : '0 0 8px var(--accent-color)' }}></span>
              {isCompleted ? 'Session Completed' : 'Active Session'}
            </span>
          </div>
        </div>
        
        {initialLoadDone && !isCompleted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft < 300 ? 'var(--accent-color)' : 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
              <FiClock /> {formatTime(timeLeft)}
            </div>
            <button 
              onClick={handleManualEnd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 82, 82, 0.1)',
                color: 'var(--accent-color)',
                border: '1px solid rgba(255, 82, 82, 0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 82, 82, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 82, 82, 0.1)'}
            >
              <FiStopCircle /> End Chat
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
            maxWidth: "80%"
          }}>
            {msg.sender === "user" ? (
              <div style={{ 
                background: 'var(--accent-color)', 
                color: 'white', 
                padding: '1rem 1.5rem', 
                borderRadius: '24px 24px 4px 24px',
                boxShadow: 'var(--accent-shadow)'
              }}>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>
              </div>
            ) : (
              <div className="neu-convex" style={{ 
                padding: '1rem 1.5rem', 
                borderRadius: '24px 24px 24px 4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {msg.action_data && (
                  <div style={{
                    padding: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '4px solid var(--accent-color)',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <strong style={{ color: 'var(--accent-color)' }}>CLINICAL ACTION</strong>
                    <pre style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                      {JSON.stringify(msg.action_data, null, 2)}
                    </pre>
                  </div>
                )}
                <p style={{ margin: 0, whiteSpace: "pre-wrap", color: 'var(--text-primary)' }}>{msg.text}</p>
                {msg.media_url && (
                  <div style={{ marginTop: '1rem' }}>
                    <img 
                      src={`${API_URL}${msg.media_url}`} 
                      alt="Clinical Reference" 
                      style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {loading && !isCompleted && (
          <div style={{ alignSelf: "flex-start" }} className="animate-fade-in">
            <div className="neu-convex" style={{ padding: '1rem 1.5rem', borderRadius: '24px 24px 24px 4px', display: 'flex', alignItems: 'center', height: '50px' }}>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isCompleted ? (
        <div className="neu-convex animate-fade-in" style={{ margin: '1rem', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiCheckCircle color="var(--accent-color)" /> Assessment Complete
          </h4>
          {feedback ? (
            <div>
              <div style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
              <button onClick={() => navigate('/student/dashboard')} className="neu-button-accent">
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
              Generating feedback...
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '1rem' }}>
          <div className="neu-convex" style={{ display: 'flex', gap: '1rem', padding: '0.5rem', borderRadius: '30px', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={loading || isCompleted}
              placeholder="Type a message..."
              style={{ 
                flex: 1, 
                padding: '1rem 1.5rem', 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <button 
              onClick={handleSend} 
              disabled={loading || !input.trim() || isCompleted}
              className="neu-button-accent"
              style={{ 
                width: '45px', 
                height: '45px', 
                borderRadius: '50%', 
                padding: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '0.25rem',
                opacity: (loading || !input.trim() || isCompleted) ? 0.5 : 1
              }}
            >
              <FiSend size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatSession;

