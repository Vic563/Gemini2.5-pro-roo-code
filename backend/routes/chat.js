const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const conversationService = require('../services/conversationService');
const { 
  asyncHandler, 
  validators, 
  ValidationError, 
  NotFoundError,
  sendSuccess 
} = require('../utils/errorHandler');
const { getConfig } = require('../config');

// In-memory conversation storage (in production, use a database)
const chatConfig = getConfig('chat');

// POST /api/chat/message - Send a message and get AI response
router.post('/message', asyncHandler(async (req, res) => {
  const { message, conversationId, attachments = [] } = req.body;

  // Validate input
  validators.required(message, 'message');
  validators.maxLength(message, 10000, 'message');
  validators.maxArrayLength(attachments, chatConfig.maxFiles || 5, 'attachments');
  
  if (conversationId) {
    validators.uuid(conversationId, 'conversationId');
  }

  // Get or create conversation
  const conversation = conversationService.getOrCreateConversation(conversationId);

  // Create and add user message
  const userMessage = {
    role: 'user',
    content: message.trim(),
    attachments: attachments
  };

  conversationService.validateMessage(userMessage);
  const { message: addedUserMessage } = conversationService.addMessage(conversation.id, userMessage);

  try {
    // Generate AI response using Gemini
    const aiResponse = await geminiService.generateContent(
      conversation.messages,
      attachments
    );

    // Create and add assistant message
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.content,
      finishReason: aiResponse.finishReason,
      usage: aiResponse.usage
    };

    const { message: addedAssistantMessage } = conversationService.addMessage(conversation.id, assistantMessage);

    sendSuccess(res, {
      conversationId: conversation.id,
      userMessage: addedUserMessage,
      assistantMessage: addedAssistantMessage,
      usage: aiResponse.usage
    }, 'Message sent successfully');

  } catch (aiError) {
    console.error('AI service error:', aiError);
    throw aiError; // Let error handler handle this
  }
}));

// GET /api/chat/conversation/:id - Get conversation history
router.get('/conversation/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  validators.uuid(id, 'conversationId');
  
  const conversation = conversationService.getConversation(id);
  sendSuccess(res, { conversation }, 'Conversation retrieved successfully');
}));

// GET /api/chat/conversations - Get all conversations (limited list)
router.get('/conversations', asyncHandler(async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  
  const result = conversationService.getConversations({ limit, offset });
  sendSuccess(res, result, 'Conversations retrieved successfully');
}));

// DELETE /api/chat/conversation/:id - Delete a conversation
router.delete('/conversation/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  validators.uuid(id, 'conversationId');
  
  const deleted = conversationService.deleteConversation(id);
  if (!deleted) {
    throw new NotFoundError('Conversation');
  }

  sendSuccess(res, null, 'Conversation deleted successfully');
}));

// POST /api/chat/clear - Clear all conversations
router.post('/clear', asyncHandler(async (req, res) => {
  const conversationCount = conversationService.clearAllConversations();
  sendSuccess(res, { cleared: conversationCount }, `Cleared ${conversationCount} conversations`);
}));

// GET /api/chat/stats - Get chat statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = conversationService.getStats();
  sendSuccess(res, { stats }, 'Statistics retrieved successfully');
}));

// POST /api/chat/validate-api - Validate Gemini API connection
router.post('/validate-api', asyncHandler(async (req, res) => {
  const isValid = await geminiService.validateApiKey();
  
  sendSuccess(res, {
    valid: isValid,
    message: isValid ? 'API key is valid' : 'API key is invalid or service unavailable'
  }, 'API validation completed');
}));

module.exports = router;