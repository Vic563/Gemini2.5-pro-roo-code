/**
 * Centralized error handling utilities
 * Provides consistent error handling and response formatting
 */

const { isDevelopment } = require('../config');

/**
 * Custom error classes
 */
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ApiError extends Error {
  constructor(message, statusCode = 500, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

/**
 * Error response formatter
 * @param {Error} error - The error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
function handleError(error, req, res, next) {
  // Log error details
  console.error(`Error in ${req.method} ${req.path}:`, {
    message: error.message,
    stack: isDevelopment() ? error.stack : undefined,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Format error response
  const errorResponse = {
    error: true,
    message: getErrorMessage(error),
    ...(error.field && { field: error.field }),
    ...(isDevelopment() && { 
      stack: error.stack,
      type: error.name,
    }),
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Get user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
function getErrorMessage(error) {
  // Return custom message for known error types
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error instanceof NotFoundError) {
    return error.message;
  }
  
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof RateLimitError) {
    return error.message;
  }

  // Handle common HTTP status codes
  switch (error.statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please check your credentials.';
    case 403:
      return 'Access forbidden. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return isDevelopment() 
        ? error.message 
        : 'An internal server error occurred. Please try again later.';
    default:
      return isDevelopment() 
        ? error.message 
        : 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Async route wrapper to handle promise rejections
 * @param {function} fn - Async route handler function
 * @returns {function} Wrapped route handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation helper functions
 */
const validators = {
  /**
   * Validate required string field
   * @param {string} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @throws {ValidationError} If validation fails
   */
  required(value, fieldName) {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`${fieldName} is required and must be a non-empty string`, fieldName);
    }
  },

  /**
   * Validate string length
   * @param {string} value - Value to validate
   * @param {number} maxLength - Maximum allowed length
   * @param {string} fieldName - Field name for error message
   * @throws {ValidationError} If validation fails
   */
  maxLength(value, maxLength, fieldName) {
    if (value && value.length > maxLength) {
      throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`, fieldName);
    }
  },

  /**
   * Validate array length
   * @param {Array} value - Array to validate
   * @param {number} maxLength - Maximum allowed length
   * @param {string} fieldName - Field name for error message
   * @throws {ValidationError} If validation fails
   */
  maxArrayLength(value, maxLength, fieldName) {
    if (value && Array.isArray(value) && value.length > maxLength) {
      throw new ValidationError(`${fieldName} must not contain more than ${maxLength} items`, fieldName);
    }
  },

  /**
   * Validate UUID format
   * @param {string} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @throws {ValidationError} If validation fails
   */
  uuid(value, fieldName) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (value && !uuidRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid UUID`, fieldName);
    }
  },
};

/**
 * Success response formatter
 * @param {object} res - Express response object
 * @param {object} data - Data to send in response
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message,
    ...(data && { data }),
  };
  
  res.status(statusCode).json(response);
}

module.exports = {
  // Error classes
  ValidationError,
  NotFoundError,
  ApiError,
  RateLimitError,
  
  // Error handling functions
  handleError,
  getErrorMessage,
  asyncHandler,
  
  // Validation helpers
  validators,
  
  // Response helpers
  sendSuccess,
};