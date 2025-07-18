import React from 'react';
import './ErrorBanner.css';

const ErrorBanner = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="error-banner">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-message">{error}</span>
        <button onClick={onDismiss} className="error-dismiss">
          ✕
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;