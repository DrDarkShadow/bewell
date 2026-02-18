import React from 'react';

const ChatMessage = ({ message, isUser }) => (
  <div style={{
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    margin: '8px 0',
  }}>
    <div
      style={{
        background: isUser
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : '#f8f9fa',
        color: isUser ? 'white' : '#333',
        borderRadius: isUser
          ? '18px 18px 4px 18px'
          : '18px 18px 18px 4px',
        padding: '12px 18px',
        maxWidth: '70%',
        marginLeft: isUser ? '20%' : 0,
        marginRight: isUser ? 0 : '20%',
        border: isUser ? 'none' : '1px solid #e9ecef',
        fontSize: '1rem',
      }}
    >
      <span style={{ fontSize: '1.2rem', marginRight: 8 }}>
        {isUser ? '🧑' : '💛'}
      </span>
      {message}
    </div>
  </div>
);

export default ChatMessage;
