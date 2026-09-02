import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChatHistory, submitMessage } from "../api";
import { FiArrowLeft, FiSend } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

function ChatSession() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getChatHistory(attemptId);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
      setMessages([{ text: "Error fetching chat history.", sender: "bot" }]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await submitMessage(attemptId, userMessage);
      setMessages((prev) => [
        ...prev,
        { text: res.data.bot_reply, sender: "bot", media_url: res.data.media_url }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { text: "Error submitting message.", sender: "bot" }
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', height: '85vh', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={() => navigate('/student/dashboard')} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '1.5rem', padding: '0.5rem', marginRight: '1rem' }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <FiArrowLeft />
        </button>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>Clinical Scenario Assessment</h3>
          <span style={{ color: 'var(--accent-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%', boxShadow: '0 0 8px var(--accent-color)' }}></span>
            Active Session
          </span>
        </div>
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
                borderRadius: '24px 24px 24px 4px'
              }}>
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
        {loading && (
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

      <div style={{ padding: '1rem' }}>
        <div className="neu-convex" style={{ display: 'flex', gap: '1rem', padding: '0.5rem', borderRadius: '30px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
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
            disabled={loading || !input.trim()}
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
              opacity: (loading || !input.trim()) ? 0.5 : 1
            }}
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatSession;
