import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { exportReports } from '../api';
import { FiDownload, FiCalendar } from 'react-icons/fi';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Need to format dates. If user picks "2026-09-16", we can append "T00:00:00Z" for start and "T23:59:59Z" for end to ensure correct bounds on the backend.
      let finalStart = '';
      if (startDate) finalStart = startDate + "T00:00:00Z";
      
      let finalEnd = '';
      if (endDate) finalEnd = endDate + "T23:59:59Z";

      const res = await exportReports(finalStart, finalEnd);
      
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'clinical_ai_reports.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
    } catch (err) {
      console.error(err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', padding: '0 2rem 4rem 2rem' }} className="animate-fade-in">
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Generate Reports</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Export student assessment data as a CSV file. You can specify a date range or leave it blank to download all records.
        </p>
      </div>

      <div className="neu-convex" style={{ padding: '3rem', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Start Date (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <FiCalendar style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="date" 
                className="neu-input" 
                style={{ paddingLeft: '2.5rem', colorScheme: 'dark' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              End Date (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <FiCalendar style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="date" 
                className="neu-input" 
                style={{ paddingLeft: '2.5rem', colorScheme: 'dark' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleDownload} 
          className="neu-button-accent" 
          disabled={loading}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.75rem',
            padding: '1rem',
            fontSize: '1.1rem',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <FiDownload />
          {loading ? 'Generating...' : 'Download CSV Report'}
        </button>
      </div>
    </div>
  );
};

export default Reports;
