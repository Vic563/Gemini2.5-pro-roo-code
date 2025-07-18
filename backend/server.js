const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Import configuration and utilities
const { config, validateConfig, isDevelopment } = require('./config');
const { handleError } = require('./utils/errorHandler');

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

const app = express();

// Import routes
const chatRoutes = require('./routes/chat');
const fileRoutes = require('./routes/files');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Middleware
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true
}));

app.use(morgan(isDevelopment() ? 'dev' : 'combined'));
app.use(bodyParser.json({ limit: config.request.bodyParserLimit }));
app.use(bodyParser.urlencoded({ extended: true, limit: config.request.bodyParserLimit }));

// Create uploads directory if it doesn't exist
if (!fs.existsSync(config.upload.uploadDir)) {
  fs.mkdirSync(config.upload.uploadDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, config.upload.uploadDir)));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use(handleError);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`Upload directory: ${config.upload.uploadDir}`);
  console.log(`API Key configured: ${config.gemini.apiKey ? 'Yes' : 'No'}`);
});