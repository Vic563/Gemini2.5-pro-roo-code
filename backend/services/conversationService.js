/**
 * Conversation Service
 * Abstracts conversation storage and management
 */

const { v4: uuidv4 } = require('uuid');
const { getConfig } = require('../config');
const { NotFoundError, ValidationError } = require('../utils/errorHandler');

class ConversationService {
  constructor() {
    // In-memory storage (in production, use a database)
    this.conversations = new Map();
    this.config = getConfig('chat');
  }

  /**
   * Create a new conversation
   * @returns {object} New conversation object
   */
  createConversation() {
    const conversation = {
      id: uuidv4(),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Get conversation by ID
   * @param {string} conversationId - The conversation ID
   * @returns {object} Conversation object
   * @throws {NotFoundError} If conversation not found
   */
  getConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }
    return conversation;
  }

  /**
   * Get or create conversation
   * @param {string} conversationId - Optional conversation ID
   * @returns {object} Conversation object
   */
  getOrCreateConversation(conversationId = null) {
    if (conversationId) {
      try {
        return this.getConversation(conversationId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          // If conversation not found, create a new one with the provided ID
          const conversation = {
            id: conversationId,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.conversations.set(conversationId, conversation);
          return conversation;
        }
        throw error;
      }
    }
    return this.createConversation();
  }

  /**
   * Add message to conversation
   * @param {string} conversationId - The conversation ID
   * @param {object} message - Message object
   * @returns {object} Updated conversation
   */
  addMessage(conversationId, message) {
    const conversation = this.getConversation(conversationId);
    
    const messageWithId = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...message
    };

    conversation.messages.push(messageWithId);
    conversation.updatedAt = new Date().toISOString();

    // Trim conversation history if it exceeds max limit
    if (conversation.messages.length > this.config.maxConversationHistory) {
      const excess = conversation.messages.length - this.config.maxConversationHistory;
      conversation.messages.splice(0, excess);
    }

    this.conversations.set(conversationId, conversation);
    return { conversation, message: messageWithId };
  }

  /**
   * Update conversation
   * @param {string} conversationId - The conversation ID
   * @param {object} updates - Updates to apply
   * @returns {object} Updated conversation
   */
  updateConversation(conversationId, updates) {
    const conversation = this.getConversation(conversationId);
    
    Object.assign(conversation, updates, {
      updatedAt: new Date().toISOString()
    });

    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  /**
   * Delete conversation
   * @param {string} conversationId - The conversation ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteConversation(conversationId) {
    return this.conversations.delete(conversationId);
  }

  /**
   * Get conversation list with pagination
   * @param {object} options - Query options
   * @returns {object} Paginated conversation list
   */
  getConversations(options = {}) {
    const { limit = 10, offset = 0 } = options;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    const conversationList = Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(offsetNum, offsetNum + limitNum)
      .map(conv => ({
        id: conv.id,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages.length,
        lastMessage: conv.messages.length > 0 
          ? conv.messages[conv.messages.length - 1].content.substring(0, 100) + '...'
          : null
      }));

    return {
      conversations: conversationList,
      total: this.conversations.size,
      limit: limitNum,
      offset: offsetNum
    };
  }

  /**
   * Clear all conversations
   * @returns {number} Number of conversations cleared
   */
  clearAllConversations() {
    const count = this.conversations.size;
    this.conversations.clear();
    return count;
  }

  /**
   * Get conversation statistics
   * @returns {object} Statistics object
   */
  getStats() {
    let totalMessages = 0;
    const totalConversations = this.conversations.size;
    
    this.conversations.forEach(conv => {
      totalMessages += conv.messages.length;
    });

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation: totalConversations > 0 
        ? Math.round(totalMessages / totalConversations * 100) / 100 
        : 0
    };
  }

  /**
   * Validate message object
   * @param {object} message - Message to validate
   * @throws {ValidationError} If validation fails
   */
  validateMessage(message) {
    if (!message || typeof message !== 'object') {
      throw new ValidationError('Message must be an object');
    }

    if (!message.role || !['user', 'assistant'].includes(message.role)) {
      throw new ValidationError('Message role must be either "user" or "assistant"');
    }

    if (!message.content || typeof message.content !== 'string') {
      throw new ValidationError('Message content is required and must be a string');
    }

    if (message.content.length > 50000) {
      throw new ValidationError('Message content exceeds maximum length of 50,000 characters');
    }
  }
}

module.exports = new ConversationService();