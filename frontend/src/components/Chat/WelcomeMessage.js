import React from 'react';
import './WelcomeMessage.css';

const WelcomeMessage = () => {
  return (
    <div className="welcome-message">
      <div className="welcome-content">
        <div className="welcome-icon">🤖</div>
        <h3>Welcome to Assistant!</h3>
        <p>Start a conversation by typing a message or uploading a document for analysis.</p>
        <div className="features-list">
          <div className="feature">
            <span className="feature-icon">📄</span>
            <span>Upload PDF, DOC, or TXT files</span>
          </div>
          <div className="feature">
            <span className="feature-icon">💬</span>
            <span>Natural conversation</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔍</span>
            <span>Document analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;