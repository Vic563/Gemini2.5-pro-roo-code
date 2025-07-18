const axios = require('axios');
const { getConfig } = require('../config');
const { ApiError } = require('../utils/errorHandler');

/**
 * GeminiService - Handles interaction with Google Gemini API
 * Provides AI content generation with retry logic and error handling
 */
class GeminiService {
  constructor() {
    this.config = getConfig('gemini');
    this.chatConfig = getConfig('chat');
  }

  /**
   * Generate content using Gemini API
   * @param {Array} messages - Array of conversation messages
   * @param {Array} attachments - Array of file attachments (optional)
   * @returns {Promise<Object>} Response with content, finishReason, and usage
   * @throws {ApiError} If API call fails
   */

  async generateContent(messages, attachments = []) {
    if (!this.config.apiKey) {
      throw new ApiError('Gemini API key not configured', 500);
    }

    const payload = this.formatRequest(messages, attachments);
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.config.apiUrl}?key=${this.config.apiKey}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: this.config.timeout,
          }
        );

        return this.formatResponse(response.data);
      } catch (error) {
        console.error(`Gemini API attempt ${attempt} failed:`, error.response?.data || error.message);
        
        if (attempt === this.config.maxRetries) {
          throw this.handleError(error);
        }

        // Wait before retry with exponential backoff
        await this.sleep(this.config.retryDelay * Math.pow(2, attempt - 1));
      }
    }
  }

  /**
   * Format request payload for Gemini API
   * @param {Array} messages - Conversation messages
   * @param {Array} attachments - File attachments
   * @returns {Object} Formatted API request payload
   */
  formatRequest(messages, attachments = []) {
    const contents = [];
    
    // Add conversation history
    messages.forEach(msg => {
      const parts = [{ text: msg.content }];
      
      // Add file attachments if present
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(attachment => {
          if (attachment.content) {
            parts.push({ text: `[Document: ${attachment.filename}]\n${attachment.content}` });
          }
        });
      }
      
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      });
    });

    // Add current attachments if any
    if (attachments.length > 0) {
      const currentMessage = contents[contents.length - 1];
      if (currentMessage && currentMessage.role === 'user') {
        attachments.forEach(attachment => {
          if (attachment.content) {
            currentMessage.parts.push({ 
              text: `[Document: ${attachment.filename}]\n${attachment.content}` 
            });
          }
        });
      }
    }

    return {
      contents: contents,
      generationConfig: {
        temperature: this.chatConfig.defaultTemperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: this.chatConfig.maxOutputTokens,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };
  }

  /**
   * Format Gemini API response
   * @param {Object} response - Raw API response
   * @returns {Object} Formatted response with content, finishReason, and usage
   * @throws {ApiError} If response format is invalid
   */
  formatResponse(response) {
    try {
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No response candidates returned from Gemini API');
      }

      const candidate = response.candidates[0];
      
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response format from Gemini API');
      }

      const content = candidate.content.parts
        .map(part => part.text)
        .join('')
        .trim();

      return {
        content: content,
        finishReason: candidate.finishReason,
        usage: response.usageMetadata || null
      };
    } catch (error) {
      console.error('Error formatting Gemini response:', error);
      throw new ApiError('Failed to process Gemini API response', 500, error);
    }
  }

  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return new ApiError(`Invalid request: ${data.error?.message || 'Bad request'}`, 400, error);
        case 401:
          return new ApiError('Invalid API key or unauthorized access', 401, error);
        case 403:
          return new ApiError('API access forbidden or quota exceeded', 403, error);
        case 429:
          return new ApiError('Rate limit exceeded. Please try again later.', 429, error);
        case 500:
          return new ApiError('Gemini API server error. Please try again later.', 500, error);
        default:
          return new ApiError(`Gemini API error (${status}): ${data.error?.message || 'Unknown error'}`, status, error);
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      return new ApiError('Request timeout. Please try again.', 408, error);
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new ApiError('Network error. Please check your internet connection.', 503, error);
    }
    
    return new ApiError(`Unexpected error: ${error.message}`, 500, error);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to validate API key
  async validateApiKey() {
    try {
      const testPayload = {
        contents: [{
          role: 'user',
          parts: [{ text: 'Hello' }]
        }]
      };

      const response = await axios.post(
        `${this.config.apiUrl}?key=${this.config.apiKey}`,
        testPayload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error('API key validation failed:', error.response?.data || error.message);
      return false;
    }
  }
}

module.exports = new GeminiService();