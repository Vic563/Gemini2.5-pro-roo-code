import React, { useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import './MessageInput.css';

const MessageInput = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  onFileSelect,
  fileInputRef,
  disabled,
  placeholder
}) => {
  const textAreaRef = useRef(null);

  // Configure dropzone for file drag and drop
  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        // Create a fake event with files
        const fakeEvent = {
          target: {
            files: acceptedFiles
          }
        };
        onFileSelect(fakeEvent);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: true, // We'll handle clicks manually
    noKeyboard: true
  });

  // Auto-resize textarea
  const handleTextChange = (e) => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    onChange(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(e);
    }
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    onSend(e);
  };

  return (
    <div className="message-input-container">
      <div 
        {...getRootProps()} 
        className={`message-input-wrapper ${isDragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
        
        {/* Hidden file input for manual selection */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.doc,.docx"
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />

        {/* Drag overlay */}
        {isDragActive && (
          <div className="drag-overlay">
            <div className="drag-content">
              <div className="drag-icon">📁</div>
              <p>Drop files here to upload</p>
              <small>PDF, TXT, DOC, DOCX (max 10MB each)</small>
            </div>
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSendClick} className="input-form">
          <div className="input-row">
            {/* File upload button */}
            <button
              type="button"
              className="file-upload-button"
              onClick={handleFileButtonClick}
              disabled={disabled}
              title="Upload files (PDF, TXT, DOC, DOCX)"
            >
              📎
            </button>

            {/* Text input */}
            <div className="text-input-container">
              <textarea
                ref={textAreaRef}
                value={value}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="message-textarea"
                rows={1}
                maxLength={4000}
              />
              
              {/* Character counter */}
              <div className="char-counter">
                {value.length}/4000
              </div>
            </div>

            {/* Send button */}
            <button
              type="submit"
              className={`send-button ${value.trim() || disabled ? 'active' : ''}`}
              disabled={disabled || (!value.trim() && !isDragActive)}
              title="Send message"
            >
              {disabled ? (
                <div className="loading-spinner-small"></div>
              ) : (
                '➤'
              )}
            </button>
          </div>

          {/* Input hints */}
          <div className="input-hints">
            <span className="hint">
              💡 Press Enter to send, Shift+Enter for new line
            </span>
            <span className="hint">
              📎 Drag & drop files or click the attachment button
            </span>
          </div>
        </form>
      </div>

      {/* File type support info */}
      <div className="file-support-info">
        <small>
          Supported files: PDF, TXT, DOC, DOCX • Max size: 10MB per file • Max files: 5
        </small>
      </div>
    </div>
  );
};

export default MessageInput;