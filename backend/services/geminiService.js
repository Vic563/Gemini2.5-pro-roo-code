const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async generateContent(messages, attachments = []) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const payload = this.formatRequest(messages, attachments);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.apiUrl}?key=${this.apiKey}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout
          }
        );

        return this.formatResponse(response.data);
      } catch (error) {
        console.error(`Gemini API attempt ${attempt} failed:`, error.response?.data || error.message);
        
        if (attempt === this.maxRetries) {
          throw this.handleError(error);
        }

        // Wait before retry with exponential backoff
        await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
      }
    }
  }

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
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
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
      throw new Error('Failed to process Gemini API response');
    }
  }

  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return new Error(`Invalid request: ${data.error?.message || 'Bad request'}`);
        case 401:
          return new Error('Invalid API key or unauthorized access');
        case 403:
          return new Error('API access forbidden or quota exceeded');
        case 429:
          return new Error('Rate limit exceeded. Please try again later.');
        case 500:
          return new Error('Gemini API server error. Please try again later.');
        default:
          return new Error(`Gemini API error (${status}): ${data.error?.message || 'Unknown error'}`);
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please try again.');
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new Error('Network error. Please check your internet connection.');
    }
    
    return new Error(`Unexpected error: ${error.message}`);
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
        `${this.apiUrl}?key=${this.apiKey}`,
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