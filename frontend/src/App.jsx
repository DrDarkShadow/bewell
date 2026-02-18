import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import BreathingExercise from './components/BreathingExercise';
import Games from './components/Games';
import { useEffect } from 'react';

const defaultMessages = [
  { role: 'assistant', content: "Hey there! 😊 I'm your friendly companion. How are you feeling today?" },
];

function App() {
  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState('');
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stress, setStress] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Simulate new chat session
  const handleNewChat = () => {
    setMessages(defaultMessages);
    setActivity(null);
  };

  // Send message to backend
  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages(data.messages);
      // Fetch stress score for latest user message
      const stressRes = await fetch('http://localhost:8001/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const stressData = await stressRes.json();
      setStress(stressData);
    } catch (e) {
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error: Could not connect to backend.' }]);
      setStress(null);
    }
    setLoading(false);
  };

  // Simulate activity selection
  const handleSelectActivity = (act) => {
    setActivity(act);
  };

  // Simulate chat history
  const handleShowHistory = () => {
    setActivity('history');
    fetchChatHistory();
  };

  // Simulate claiming affirmation

  // Save chat session after each conversation
  useEffect(() => {
    if (messages.length > 1 && !activity && !loading) {
      const session = {
        id: Date.now().toString(),
        messages,
        timestamp: new Date().toISOString(),
      };
      fetch('http://localhost:8001/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
    }
  }, [messages, activity, loading]);

  // Fetch chat history from backend
  const fetchChatHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('http://localhost:8001/api/history');
      const data = await res.json();
      setChatHistory(data);
    } catch (e) {
      setChatHistory([]);
    }
    setHistoryLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #fff9e6 0%, #ffffff 100%)' }}>
      <Sidebar
        onNewChat={handleNewChat}
        onShowHistory={handleShowHistory}
        onSelectActivity={handleSelectActivity}
      />
      <main style={{ flex: 1, padding: '32px 0', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#856404', fontSize: '2rem', fontWeight: 600 }}>💛 Companion Bot</h1>
          <p style={{ color: '#856404', opacity: 0.8, fontSize: '1rem' }}>
            Your friendly chat companion - here to listen, play, and relax with you!
          </p>
        </div>
        {/* Main content area based on activity */}
        {activity === 'breathing' && (
          <BreathingExercise cycles={3} />
        )}
        {activity === 'stress_tracker' && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <h2>📊 Stress Tracker</h2>
            {stress ? (
              <div style={{
                background: '#fffbe7',
                border: '2px solid #ffc107',
                borderRadius: 15,
                padding: 25,
                maxWidth: 400,
                margin: '0 auto',
                color: '#856404',
                fontSize: '1.2rem',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  Stress Score: {(stress.stress_score * 100).toFixed(0)}%
                </div>
                <div>Level: <b>{stress.stress_level.toUpperCase()}</b></div>
                <div>Sentiment: {stress.sentiment}</div>
                <div>Primary Emotion: {stress.emotion}</div>
                <div style={{ marginTop: 12, fontStyle: 'italic' }}>{stress.recommendation}</div>
              </div>
            ) : (
              <p>Send a message to analyze your stress score.</p>
            )}
          </div>
        )}
        {activity === 'game' && (
          <Games />
        )}
        {activity === 'history' && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <h2>📜 Chat History</h2>
            {historyLoading ? <p>Loading...</p> : (
              chatHistory.length === 0 ? <p>No previous chat sessions found.</p> :
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {chatHistory.map((session) => (
                  <li key={session.id} style={{ marginBottom: 24, border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{session.timestamp}</div>
                    {session.messages.map((msg, idx) => (
                      <div key={idx} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', color: msg.role === 'user' ? '#333' : '#856404' }}>
                        <b>{msg.role === 'user' ? 'You' : 'Bot'}:</b> {msg.content}
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {!activity && (
          <>
            <div style={{ minHeight: 350, marginBottom: 24 }}>
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  message={msg.content}
                  isUser={msg.role === 'user'}
                />
              ))}
              {loading && <ChatMessage message="Thinking..." isUser={false} />}
            </div>
            <ChatInput value={input} onChange={setInput} onSend={handleSend} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
