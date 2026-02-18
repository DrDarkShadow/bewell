import React from 'react';

const ChatInput = ({ value, onChange, onSend }) => (
  <form
    onSubmit={e => {
      e.preventDefault();
      onSend();
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      marginTop: 24,
      gap: 8,
      justifyContent: 'center',
    }}
  >
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Type your message here... 💬"
      style={{
        borderRadius: 25,
        border: '2px solid #ffc107',
        background: 'white',
        padding: '12px 20px',
        fontSize: '1rem',
        width: 350,
        outline: 'none',
      }}
    />
    <button
      type="submit"
      style={{
        borderRadius: 25,
        background: '#ffc107',
        color: '#856404',
        border: 'none',
        padding: '12px 24px',
        fontWeight: 600,
        fontSize: '1rem',
        cursor: 'pointer',
      }}
    >
      Send
    </button>
  </form>
);

export default ChatInput;
