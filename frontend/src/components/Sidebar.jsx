import React from 'react';

const Sidebar = ({ onNewChat, onShowHistory, onSelectActivity }) => (
  <aside style={{
    background: 'linear-gradient(180deg, #fff3cd 0%, #ffeeba 100%)',
    minWidth: 220,
    maxWidth: 320,
    padding: 24,
    borderRadius: 18,
    boxShadow: '0 2px 8px #ffe0ec',
    marginRight: 24,
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  }}>
    <h2 style={{ color: '#856404', marginBottom: 0 }}>💛 Companion Bot</h2>
    <p style={{ color: '#856404', marginTop: 0 }}>Your friendly wellness companion</p>
    <button onClick={onNewChat} style={btnStyle}>💬 New Chat Session</button>
    <button onClick={() => onSelectActivity('game')} style={btnStyle}>🎮 Games</button>
    <button onClick={() => onSelectActivity('breathing')} style={btnStyle}>🌬️ Breathing Exercise</button>
    <button onClick={() => onSelectActivity('stress_tracker')} style={btnStyle}>📊 Stress Tracker</button>
    <button onClick={onShowHistory} style={btnStyle}>📜 Chat History</button>
  </aside>
);

const btnStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.7)',
  color: '#856404',
  border: '2px solid rgba(255, 193, 7, 0.4)',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: '1rem',
  fontWeight: 600,
  textAlign: 'left',
  margin: '4px 0',
  cursor: 'pointer',
};

export default Sidebar;
