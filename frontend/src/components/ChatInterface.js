import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import FileAttachment from './FileAttachment';
import TypingIndicator from './TypingIndicator';
import './ChatInterface.css';

const ChatInterface = () => {
  const {
    messages,
    isLoading,
    isTyping,
    error,
    attachments,
    uploadingFiles,
    sendMessage,
    uploadFiles,
    clearConversation,
    setError,
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && attachments.length === 0) return;

    await sendMessage(messageText);
    setMessageText('');
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      clearConversation();
    }
  };

  const dismissError = () => {
    setError(null);
  };

  return (
    <div className="chat-interface">
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-title">
            <h2>💬 Chat with Assistant</h2>
            <span className="message-count">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="chat-actions">
            <button 
              onClick={handleClearChat}
              className="clear-chat-btn"
              disabled={messages.length === 0}
              title="Clear conversation"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{error}</span>
              <button onClick={dismissError} className="error-dismiss">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* File Attachments Display */}
        {attachments.length > 0 && (
          <div className="attachments-preview">
            <h4>📎 Attached Files ({attachments.length})</h4>
            <div className="attachments-list">
              {attachments.map((attachment) => (
                <FileAttachment 
                  key={attachment.id} 
                  attachment={attachment}
                  showContent={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="messages-area">
          {messages.length === 0 ? (
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
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {/* Typing Indicator */}
              {isTyping && <TypingIndicator />}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* File Upload Progress */}
        {uploadingFiles && (
          <div className="upload-progress">
            <div className="upload-indicator">
              <div className="upload-spinner"></div>
              <span>Processing files...</span>
            </div>
          </div>
        )}

        {/* Message Input Area */}
        <div className="input-area">
          <MessageInput
            value={messageText}
            onChange={setMessageText}
            onSend={handleSendMessage}
            onKeyPress={handleKeyPress}
            onFileSelect={handleFileSelect}
            fileInputRef={fileInputRef}
            disabled={isLoading || uploadingFiles}
            placeholder={
              attachments.length > 0 
                ? `Ask about your ${attachments.length} attached file${attachments.length !== 1 ? 's' : ''}...`
                : "Type your message or upload a file to analyze..."
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;