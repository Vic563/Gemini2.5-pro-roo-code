import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import './FileAttachment.css';

const FileAttachment = ({ attachment, showContent = true, removable = true }) => {
  const { removeAttachment } = useChat();
  const [isExpanded, setIsExpanded] = useState(false);

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      case 'docx':
      case 'doc':
        return '📘';
      default:
        return '📎';
    }
  };

  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return '#dc2626';
      case 'txt':
        return '#059669';
      case 'docx':
      case 'doc':
        return '#2563eb';
      default:
        return '#6b7280';
    }
  };

  const handleRemove = () => {
    if (removable && removeAttachment) {
      removeAttachment(attachment.id);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getPreviewContent = () => {
    if (!attachment.content) return null;
    
    const maxLength = 200;
    if (attachment.content.length <= maxLength || isExpanded) {
      return attachment.content;
    }
    
    return attachment.content.substring(0, maxLength) + '...';
  };

  return (
    <div className="file-attachment">
      <div className="attachment-header">
        <div className="file-info">
          <span 
            className="file-icon"
            style={{ color: getFileTypeColor(attachment.fileType) }}
          >
            {getFileIcon(attachment.fileType)}
          </span>
          
          <div className="file-details">
            <div className="file-name" title={attachment.filename}>
              {attachment.filename}
            </div>
            <div className="file-meta">
              <span className="file-type">{attachment.fileType.toUpperCase()}</span>
              <span className="file-size">{attachment.formattedSize}</span>
              {attachment.wordCount && (
                <span className="word-count">{attachment.wordCount} words</span>
              )}
            </div>
          </div>
        </div>

        <div className="attachment-actions">
          {showContent && attachment.content && (
            <button
              className="action-btn expand-btn"
              onClick={toggleExpanded}
              title={isExpanded ? 'Collapse content' : 'Expand content'}
            >
              {isExpanded ? '📖' : '👁️'}
            </button>
          )}
          
          {removable && (
            <button
              className="action-btn remove-btn"
              onClick={handleRemove}
              title="Remove attachment"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content Preview */}
      {showContent && attachment.content && (
        <div className="attachment-content">
          <div className="content-preview">
            <pre className="content-text">{getPreviewContent()}</pre>
            
            {attachment.content.length > 200 && (
              <button 
                className="toggle-content-btn"
                onClick={toggleExpanded}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Processing Status */}
      {attachment.isProcessing && (
        <div className="processing-status">
          <div className="processing-spinner"></div>
          <span>Processing file...</span>
        </div>
      )}
    </div>
  );
};

export default FileAttachment;