import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import BreathingExercise from './components/BreathingExercise';
import Games from './components/Games';

const defaultMessages = [
  { role: 'assistant', content: "Hey there! 😊 I'm your friendly companion. How are you feeling today?" },
];

const BACKEND_URL = 'http://localhost:8000/api/v1';

function App() {
  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState('');
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stress, setStress] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [token, setToken] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  
  // Transparent Login on load
  useEffect(() => {
    const defaultLogin = async () => {
      try {
        // Try login first
        const loginData = { email: "dev_user@example.com", password: "Password123" };
        let res = await fetch(`${BACKEND_URL}/auth/local/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData)
        });
        
        if (!res.ok) {
          // If login fails (user doesn't exist), try to signup
          const signupData = { ...loginData, name: "Dev User", role: "patient" };
          res = await fetch(`${BACKEND_URL}/auth/local/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupData)
          });
        }
        
        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
        } else {
          console.error("Failed to authenticate with backend:", await res.text());
        }
      } catch (e) {
        console.error("Backend connection error:", e);
      }
    };
    
    defaultLogin();
  }, []);

  // Start a new chat session when token is ready or when requested
  useEffect(() => {
    if (token && !conversationId) {
      handleNewChat();
    }
  }, [token]);

  const handleNewChat = async () => {
    if (!token) return;
    
    setMessages(defaultMessages);
    setActivity(null);
    setStress(null);
    
    try {
      const res = await fetch(`${BACKEND_URL}/patient/chat/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversation_id);
      }
    } catch (e) {
      console.error("Failed to start chat session", e);
    }
  };

  // Send message to backend
  const handleSend = async () => {
    if (!input.trim() || !conversationId || !token) return;
    
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/patient/chat/${conversationId}/message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: input }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
         // Update messages
         // We only append the AI's response because we already optimistically added the user's message
         setMessages([...newMessages, { role: 'assistant', content: data.ai_message.content }]);
         
         // Update stress state from the emotion data embedded in the response
         if (data.emotion && !data.emotion.error) {
             setStress(data.emotion);
         }
      } else {
         setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error: Something went wrong on the server.' }]);
      }
    } catch (e) {
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error: Could not connect to backend.' }]);
    }
    setLoading(false);
  };

  // Simulate activity selection
  const handleSelectActivity = (act) => {
    setActivity(act);
    if (act === 'history') {
      fetchChatHistory();
    }
  };

  const handleShowHistory = () => {
    handleSelectActivity('history');
  };

  // Fetch chat history from backend
  const fetchChatHistory = async () => {
    if (!token) return;
    
    setHistoryLoading(true);
    try {
      // Fetch list of conversations
      const res = await fetch(`${BACKEND_URL}/patient/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const histories = [];
        
        // Fetch actual messages for the most recent 5 conversations
        for (const conv of data.slice(0, 5)) {
            const msgRes = await fetch(`${BACKEND_URL}/patient/chat/${conv.id}/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (msgRes.ok) {
                const msgData = await msgRes.json();
                
                // Map backend message format to frontend format
                const mappedMessages = msgData.messages.map(m => ({
                    role: m.sender === 'patient' ? 'user' : 'assistant',
                    content: m.content
                }));
                
                histories.push({
                    id: conv.id,
                    timestamp: new Date(conv.started_at).toLocaleString(),
                    messages: mappedMessages
                });
            }
        }
        setChatHistory(histories);
      }
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
          {!token && <p style={{ color: 'red', fontSize: '0.8rem' }}>Connecting to Backend...</p>}
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
                <div>Sentiment: {stress.sentiment?.label || stress.sentiment}</div>
                <div>Primary Emotion: {stress.emotions?.primary_emotion || stress.emotion}</div>
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
            <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={!token || !conversationId || loading} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
