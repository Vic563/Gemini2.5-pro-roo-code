const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const { v4: uuidv4 } = require('uuid');

// In-memory conversation storage (in production, use a database)
const conversations = new Map();

// POST /api/chat/message - Send a message and get AI response
router.post('/message', async (req, res) => {
  try {
    const { message, conversationId, attachments = [] } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message is required and must be a non-empty string' 
      });
    }

    // Get or create conversation
    const convId = conversationId || uuidv4();
    let conversation = conversations.get(convId);
    
    if (!conversation) {
      conversation = {
        id: convId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      conversations.set(convId, conversation);
    }

    // Add user message to conversation
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: message.trim(),
      attachments: attachments,
      timestamp: new Date().toISOString()
    };
    
    conversation.messages.push(userMessage);

    try {
      // Generate AI response using Gemini
      const aiResponse = await geminiService.generateContent(
        conversation.messages,
        attachments
      );

      // Add AI response to conversation
      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        finishReason: aiResponse.finishReason,
        usage: aiResponse.usage
      };

      conversation.messages.push(assistantMessage);
      conversation.updatedAt = new Date().toISOString();

      // Update conversation in storage
      conversations.set(convId, conversation);

      res.json({
        success: true,
        conversationId: convId,
        userMessage: userMessage,
        assistantMessage: assistantMessage,
        usage: aiResponse.usage
      });

    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Return error response but keep the user message in conversation
      res.status(500).json({
        error: 'Failed to generate AI response',
        message: aiError.message,
        conversationId: convId,
        userMessage: userMessage
      });
    }

  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/chat/conversation/:id - Get conversation history
router.get('/conversation/:id', (req, res) => {
  try {
    const { id } = req.params;
    const conversation = conversations.get(id);

    if (!conversation) {
      return res.status(404).json({ 
        error: 'Conversation not found' 
      });
    }

    res.json({
      success: true,
      conversation: conversation
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/chat/conversations - Get all conversations (limited list)
router.get('/conversations', (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    const conversationList = Array.from(conversations.values())
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

    res.json({
      success: true,
      conversations: conversationList,
      total: conversations.size,
      limit: limitNum,
      offset: offsetNum
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// DELETE /api/chat/conversation/:id - Delete a conversation
router.delete('/conversation/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!conversations.has(id)) {
      return res.status(404).json({ 
        error: 'Conversation not found' 
      });
    }

    conversations.delete(id);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// POST /api/chat/clear - Clear all conversations
router.post('/clear', (req, res) => {
  try {
    const conversationCount = conversations.size;
    conversations.clear();

    res.json({
      success: true,
      message: `Cleared ${conversationCount} conversations`
    });

  } catch (error) {
    console.error('Clear conversations error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/chat/stats - Get chat statistics
router.get('/stats', (req, res) => {
  try {
    let totalMessages = 0;
    let totalConversations = conversations.size;
    
    conversations.forEach(conv => {
      totalMessages += conv.messages.length;
    });

    res.json({
      success: true,
      stats: {
        totalConversations,
        totalMessages,
        averageMessagesPerConversation: totalConversations > 0 
          ? Math.round(totalMessages / totalConversations * 100) / 100 
          : 0
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// POST /api/chat/validate-api - Validate Gemini API connection
router.post('/validate-api', async (req, res) => {
  try {
    const isValid = await geminiService.validateApiKey();
    
    res.json({
      success: true,
      valid: isValid,
      message: isValid ? 'API key is valid' : 'API key is invalid or service unavailable'
    });

  } catch (error) {
    console.error('API validation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;