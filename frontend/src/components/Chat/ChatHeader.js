import React from 'react';
import './ChatHeader.css';

const ChatHeader = ({ messageCount, onClearChat }) => {
  return (
    <div className="chat-header">
      <div className="chat-title">
        <h2>💬 Chat with Assistant</h2>
        <span className="message-count">
          {messageCount} message{messageCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="chat-actions">
        <button 
          onClick={onClearChat}
          className="clear-chat-btn"
          disabled={messageCount === 0}
          title="Clear conversation"
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;