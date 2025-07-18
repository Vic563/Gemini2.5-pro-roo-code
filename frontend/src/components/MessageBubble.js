import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import moment from 'moment';
import './MessageBubble.css';

const MessageBubble = ({ message }) => {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const isUser = message.role === 'user';
  const isLongMessage = message.content && message.content.length > 500;

  useEffect(() => {
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeMediaQuery.matches);
    };

    checkDarkMode();

    // Listen for changes
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      darkModeMediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  const formatTimestamp = (timestamp) => {
    const messageTime = moment(timestamp);
    const now = moment();
    
    if (now.diff(messageTime, 'days') === 0) {
      return messageTime.format('HH:mm');
    } else if (now.diff(messageTime, 'days') === 1) {
      return `Yesterday ${messageTime.format('HH:mm')}`;
    } else {
      return messageTime.format('MMM DD, HH:mm');
    }
  };

  const getDisplayContent = () => {
    if (!isLongMessage || isExpanded) {
      return message.content;
    }
    return message.content.substring(0, 500) + '...';
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      // Could add a toast notification here
    });
  };

  return (
    <div 
      className={`message-bubble-container ${isUser ? 'user' : 'assistant'}`}
      dir="ltr"
      style={{
        maxWidth: isUser ? "70%" : "85%",
        alignSelf: isUser ? "flex-end" : "flex-start",
        margin: isUser ? "12px 0 12px auto" : "12px auto 12px 0",
      }}
    >
      <div 
        className="message-bubble"
        onClick={() => setShowTimestamp(!showTimestamp)}
      >
        {/* Message Content */}
        <div 
          className="message-content"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            fontSize: "1.15rem",
            lineHeight: 1.7,
            padding: "20px 28px",
            letterSpacing: "0.01em",
            borderRadius: "16px",
            background: isUser 
              ? (isDarkMode ? "#1e3a5f" : "#d1e7ff")
              : (isDarkMode ? "#374151" : "#f8f9fa"),
            color: isDarkMode ? "#e2e8f0" : "#222",
            boxShadow: isUser
              ? (isDarkMode ? "0 2px 12px rgba(59, 130, 246, 0.2)" : "0 2px 12px rgba(0, 120, 255, 0.1)")
              : (isDarkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.08)"),
            direction: "ltr",
            transition: "all 0.2s ease",
            border: isUser 
              ? (isDarkMode ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(0, 120, 255, 0.1)")
              : (isDarkMode ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)"),
          }}
          tabIndex={0}
          aria-label={isUser ? "User message" : "AI response"}
        >
          {isUser ? (
            <div className="user-message">
              {message.content}
              
              {/* Show attachments for user messages */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="message-attachments" style={{ marginTop: "12px", padding: "12px", backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)", borderRadius: "8px" }}>
                  <div className="attachments-header" style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                    📎 {message.attachments.length} file{message.attachments.length !== 1 ? 's' : ''} attached
                  </div>
                  <div className="attachments-list">
                    {message.attachments.map((attachment, index) => (
                      <div key={index} className="attachment-item" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                        <span className="attachment-icon">
                          {attachment.fileType === 'pdf' && '📄'}
                          {attachment.fileType === 'txt' && '📝'}
                          {attachment.fileType === 'docx' && '📘'}
                          {attachment.fileType === 'doc' && '📘'}
                        </span>
                        <span className="attachment-name" style={{ fontSize: "0.9rem" }}>{attachment.filename}</span>
                        <span className="attachment-size" style={{ fontSize: "0.8rem", opacity: 0.7 }}>({attachment.formattedSize})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="assistant-message">
              <ReactMarkdown className="markdown-content" components={{
                p: ({children}) => <p style={{margin: "0 0 1.2em 0", lineHeight: 1.7, letterSpacing: "0.01em"}}>{children}</p>,
                pre: ({children}) => <pre style={{backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", padding: "16px 20px", borderRadius: "10px", fontSize: "1rem", overflowX: "auto", lineHeight: 1.6}}>{children}</pre>,
                code: ({children}) => <code style={{backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", padding: "3px 8px", borderRadius: "5px", fontSize: "0.98rem", fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace"}}>{children}</code>
              }}>
                {getDisplayContent()}
              </ReactMarkdown>
              
              {/* Expand/Collapse for long messages */}
              {isLongMessage && (
                <button 
                  className="expand-button"
                  onClick={toggleExpanded}
                  style={{
                    marginTop: "12px",
                    padding: "8px 16px",
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "background-color 0.2s"
                  }}
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Message Actions */}
        <div className="message-actions" style={{ marginTop: "8px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button 
            className="action-button copy-button"
            onClick={copyToClipboard}
            title="Copy message"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "4px",
              fontSize: "0.9rem",
              opacity: 0.6,
              transition: "opacity 0.2s"
            }}
          >
            📋
          </button>
          
          {!isUser && (
            <button 
              className="action-button regenerate-button"
              title="Regenerate response"
              onClick={() => {
                // Could implement regenerate functionality
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "4px",
                fontSize: "0.9rem",
                opacity: 0.6,
                transition: "opacity 0.2s"
              }}
            >
              🔄
            </button>
          )}
        </div>

        {/* Message Status */}
        <div className="message-status" style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", opacity: 0.7 }}>
          {isUser ? (
            <span className="user-avatar">👤</span>
          ) : (
            <span className="ai-avatar">🤖</span>
          )}
          
          {message.finishReason && (
            <span className="finish-reason" title={`Finish reason: ${message.finishReason}`}>
              {message.finishReason === 'STOP' && '✓'}
              {message.finishReason === 'MAX_TOKENS' && '⚠️'}
              {message.finishReason === 'SAFETY' && '🛡️'}
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      {showTimestamp && (
        <div className="message-timestamp" style={{ marginTop: "8px", fontSize: "0.8rem", opacity: 0.6, textAlign: isUser ? "right" : "left" }}>
          {formatTimestamp(message.timestamp)}
          
          {/* Token usage info for Assistant messages */}
          {!isUser && message.usage && (
            <div className="usage-info" style={{ marginTop: "4px" }}>
              Tokens: {message.usage.totalTokenCount || 'N/A'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;