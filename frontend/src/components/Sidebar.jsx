import React from 'react';

const Sidebar = ({ onNewChat, onShowHistory, onSelectActivity }) => (
  <aside className="sidebar">
    <div className="sidebar-head">
      <h2>Companion Bot</h2>
      <p>Your friendly wellness companion</p>
    </div>
    <button onClick={onNewChat} className="sidebar-button">New Chat Session</button>
    <button onClick={() => onSelectActivity('game')} className="sidebar-button">Games</button>
    <button onClick={() => onSelectActivity('breathing')} className="sidebar-button">Breathing Exercise</button>
    <button onClick={() => onSelectActivity('stress_tracker')} className="sidebar-button">Stress Tracker</button>
    <button onClick={onShowHistory} className="sidebar-button">Chat History</button>
  </aside>
);

export default Sidebar;
