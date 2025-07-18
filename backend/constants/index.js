/**
 * Application Constants
 * Centralizes all constants and magic numbers used throughout the application
 */

const CONSTANTS = {
  // File handling
  FILE_TYPES: {
    ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.doc', '.docx'],
    MAX_SIZE_MB: 10,
    MAX_SIZE_BYTES: 10485760, // 10MB in bytes
    MAX_FILES_PER_UPLOAD: 5,
  },

  // API Response
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TIMEOUT: 408,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Message limits
  MESSAGE: {
    MAX_LENGTH: 50000,
    MAX_HISTORY_DISPLAY: 100,
    TRUNCATE_PREVIEW_LENGTH: 100,
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },

  // Gemini API
  GEMINI: {
    MAX_RETRIES: 3,
    TIMEOUT_MS: 30000,
    RETRY_DELAY_MS: 1000,
    GENERATION_CONFIG: {
      TOP_K: 40,
      TOP_P: 0.95,
      DEFAULT_TEMPERATURE: 0.7,
      MAX_OUTPUT_TOKENS: 8192,
    },
    SAFETY_THRESHOLD: 'BLOCK_MEDIUM_AND_ABOVE',
  },

  // UI Messages
  MESSAGES: {
    WELCOME: 'Welcome to Assistant!',
    PROCESSING_FILES: 'Processing files...',
    API_VALIDATION_SUCCESS: 'API key is valid',
    API_VALIDATION_FAILED: 'API key is invalid or service unavailable',
    CONVERSATION_DELETED: 'Conversation deleted successfully',
    CONVERSATIONS_CLEARED: 'conversations cleared',
    MESSAGE_SENT: 'Message sent successfully',
    CONVERSATION_RETRIEVED: 'Conversation retrieved successfully',
    CONVERSATIONS_RETRIEVED: 'Conversations retrieved successfully',
    STATS_RETRIEVED: 'Statistics retrieved successfully',
    API_VALIDATION_COMPLETED: 'API validation completed',
  },

  // Error Messages
  ERRORS: {
    MESSAGE_REQUIRED: 'Message is required and must be a non-empty string',
    MESSAGE_TOO_LONG: 'Message exceeds maximum length',
    INVALID_UUID: 'must be a valid UUID',
    CONVERSATION_NOT_FOUND: 'Conversation not found',
    API_KEY_NOT_CONFIGURED: 'Gemini API key not configured',
    INVALID_REQUEST: 'Invalid request format',
    UNAUTHORIZED_ACCESS: 'Invalid API key or unauthorized access',
    QUOTA_EXCEEDED: 'API access forbidden or quota exceeded',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
    SERVER_ERROR: 'Gemini API server error. Please try again later.',
    TIMEOUT: 'Request timeout. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    RESPONSE_PROCESSING_FAILED: 'Failed to process Gemini API response',
    INTERNAL_ERROR: 'An internal server error occurred. Please try again later.',
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again later.',
  },

  // File types MIME mapping
  MIME_TYPES: {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },

  // Conversation limits
  CONVERSATION: {
    MAX_HISTORY: 50,
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },

  // UI Constants
  UI: {
    TYPING_DELAY: 1000,
    AUTO_SCROLL_DELAY: 100,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
  },

  // Validation patterns
  PATTERNS: {
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // Environment
  NODE_ENV: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
  },
};

// Freeze the constants to prevent modification
Object.freeze(CONSTANTS);

module.exports = CONSTANTS;