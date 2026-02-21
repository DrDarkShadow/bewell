import React from 'react';

const ChatInput = ({ value, onChange, onSend }) => (
  <form
    onSubmit={e => {
      e.preventDefault();
      onSend();
    }}
    className="chat-input"
  >
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Type your message here... 💬"
      className="chat-input-field"
    />
    <button
      type="submit"
      className="chat-input-button"
    >
      Send
    </button>
  </form>
);

export default ChatInput;
