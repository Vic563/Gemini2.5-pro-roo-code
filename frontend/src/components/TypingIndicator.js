import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = () => {
  return (
    <div className="typing-indicator-container assistant">
      <div className="typing-indicator">
        <div className="typing-avatar">
          <span className="ai-avatar">🤖</span>
        </div>
        
        <div className="typing-bubble">
          <div className="typing-dots">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
          <span className="typing-text">Assistant is typing...</span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;