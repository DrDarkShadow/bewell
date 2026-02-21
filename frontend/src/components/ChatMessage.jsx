import React from 'react';

const ChatMessage = ({ message, isUser }) => (
  <div className={`chat-row ${isUser ? 'user' : 'bot'}`}>
    <div className={`chat-bubble ${isUser ? 'user' : 'bot'}`}>
      <span className="chat-avatar">{isUser ? '🧑' : '💛'}</span>
      {message}
    </div>
  </div>
);

export default ChatMessage;
