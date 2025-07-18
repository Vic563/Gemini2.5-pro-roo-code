import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import MessageInput from './MessageInput';
import ChatHeader from './Chat/ChatHeader';
import ErrorBanner from './Chat/ErrorBanner';
import AttachmentsPreview from './Chat/AttachmentsPreview';
import MessagesList from './Chat/MessagesList';
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

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <div className="chat-interface">
      <div className="chat-container">
        {/* Chat Header */}
        <ChatHeader 
          messageCount={messages.length}
          onClearChat={handleClearChat}
        />

        {/* Error Banner */}
        <ErrorBanner 
          error={error}
          onDismiss={handleDismissError}
        />

        {/* File Attachments Display */}
        <AttachmentsPreview attachments={attachments} />

        {/* Messages Area */}
        <div className="messages-area">
          <MessagesList 
            messages={messages}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
          />
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