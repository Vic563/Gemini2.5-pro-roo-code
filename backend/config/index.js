/**
 * Centralized configuration management
 * Consolidates all environment variables and default values
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Gemini API Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    apiUrl: process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES) || 3,
    timeout: parseInt(process.env.GEMINI_TIMEOUT) || 30000,
    retryDelay: parseInt(process.env.GEMINI_RETRY_DELAY) || 1000,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    uploadDir: process.env.UPLOAD_DIR || 'uploads/',
    allowedTypes: ['.pdf', '.txt', '.doc', '.docx'],
    maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5,
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Request Configuration
  request: {
    bodyParserLimit: process.env.BODY_PARSER_LIMIT || '10mb',
  },

  // Chat Configuration
  chat: {
    maxConversationHistory: parseInt(process.env.MAX_CONVERSATION_HISTORY) || 50,
    defaultTemperature: parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
    maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS) || 8192,
  },

  // Security Configuration
  security: {
    corsOrigin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:3000',
  },
};

/**
 * Validate required configuration
 * @throws {Error} If required configuration is missing
 */
function validateConfig() {
  const errors = [];

  if (!config.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  if (!config.gemini.apiUrl) {
    errors.push('GEMINI_API_URL is required');
  }

  if (config.upload.maxFileSize <= 0) {
    errors.push('MAX_FILE_SIZE must be greater than 0');
  }

  if (config.rateLimit.maxRequests <= 0) {
    errors.push('RATE_LIMIT_MAX_REQUESTS must be greater than 0');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get configuration for a specific module
 * @param {string} module - Module name (server, gemini, upload, etc.)
 * @returns {object} Module configuration
 */
function getConfig(module) {
  if (module && config[module]) {
    return config[module];
  }
  return config;
}

/**
 * Check if running in development mode
 * @returns {boolean}
 */
function isDevelopment() {
  return config.server.nodeEnv === 'development';
}

/**
 * Check if running in production mode
 * @returns {boolean}
 */
function isProduction() {
  return config.server.nodeEnv === 'production';
}

module.exports = {
  config,
  getConfig,
  validateConfig,
  isDevelopment,
  isProduction,
};