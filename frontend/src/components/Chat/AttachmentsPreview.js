import React from 'react';
import FileAttachment from '../FileAttachment';
import './AttachmentsPreview.css';

const AttachmentsPreview = ({ attachments }) => {
  if (attachments.length === 0) return null;

  return (
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
  );
};

export default AttachmentsPreview;