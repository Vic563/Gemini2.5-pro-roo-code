import React from 'react';
import MessageBubble from '../MessageBubble';
import TypingIndicator from '../TypingIndicator';
import WelcomeMessage from './WelcomeMessage';
import './MessagesList.css';

const MessagesList = ({ messages, isTyping, messagesEndRef }) => {
  if (messages.length === 0) {
    return <WelcomeMessage />;
  }

  return (
    <div className="messages-list">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      
      {/* Typing Indicator */}
      {isTyping && <TypingIndicator />}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesList;