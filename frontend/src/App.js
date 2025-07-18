import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import { ChatProvider } from './context/ChatContext';
import './App.css';

function App() {
  const [isApiValid, setIsApiValid] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validate API connection on app load
    validateApi();
  }, []);

  const validateApi = async () => {
    try {
      const response = await fetch('/api/chat/validate-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setIsApiValid(data.valid);
    } catch (error) {
      console.error('API validation failed:', error);
      setIsApiValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Initializing Chat...</p>
      </div>
    );
  }

  if (isApiValid === false) {
    return (
      <div className="app-error">
        <div className="error-container">
          <h2>⚠️ API Configuration Error</h2>
          <p>Unable to connect to the Gemini service. Please check your API configuration.</p>
          <button onClick={validateApi} className="retry-button">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <ChatProvider>
        <div className="app-container">
          <header className="app-header">
            <div className="header-content">
              <h1 className="app-title">
                <span className="ai-icon">🤖</span>
                Assistant
              </h1>
              <div className="header-status">
                <span className="status-indicator online"></span>
                <span className="status-text">Connected</span>
              </div>
            </div>
          </header>
          
          <main className="app-main">
            <ChatInterface />
          </main>
        </div>
      </ChatProvider>
    </div>
  );
}

export default App;