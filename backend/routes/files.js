const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const fileProcessor = require('../services/fileProcessor');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename to avoid conflicts
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: PDF, TXT, DOC, DOCX`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

// POST /api/files/upload - Upload and process files
router.post('/upload', upload.array('files', 5), async (req, res) => {
  const uploadedFiles = [];
  const errors = [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one file to upload'
      });
    }

    // Process each uploaded file
    for (const file of req.files) {
      try {
        // Validate file
        const validationErrors = fileProcessor.validateFile(file);
        if (validationErrors.length > 0) {
          errors.push({
            filename: file.originalname,
            errors: validationErrors
          });
          // Clean up invalid file
          fileProcessor.cleanupFile(file.path);
          continue;
        }

        // Extract content from file
        const extractedData = await fileProcessor.extractContent(file.path, file.mimetype);
        
        // Create file record
        const fileRecord = {
          id: uuidv4(),
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          formattedSize: fileProcessor.formatFileSize(file.size),
          fileType: fileProcessor.getFileType(file.mimetype),
          content: extractedData.content,
          wordCount: extractedData.wordCount,
          extractedAt: extractedData.extractedAt,
          uploadedAt: new Date().toISOString(),
          path: file.path
        };

        uploadedFiles.push(fileRecord);

        // Clean up the physical file after processing (optional)
        // fileProcessor.cleanupFile(file.path);

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
        
        // Clean up file on error
        fileProcessor.cleanupFile(file.path);
      }
    }

    // Return response
    if (uploadedFiles.length === 0 && errors.length > 0) {
      return res.status(400).json({
        error: 'No files could be processed',
        details: errors
      });
    }

    res.json({
      success: true,
      message: `Successfully processed ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fileProcessor.cleanupFile(file.path);
      });
    }

    res.status(500).json({
      error: 'File upload failed',
      message: error.message
    });
  }
});

// POST /api/files/process - Process a single file by path
router.post('/process', async (req, res) => {
  try {
    const { filePath, mimetype } = req.body;

    if (!filePath || !mimetype) {
      return res.status(400).json({
        error: 'File path and mimetype are required'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        path: filePath
      });
    }

    // Extract content
    const extractedData = await fileProcessor.extractContent(filePath, mimetype);
    
    res.json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({
      error: 'File processing failed',
      message: error.message
    });
  }
});

// GET /api/files/supported-types - Get supported file types
router.get('/supported-types', (req, res) => {
  try {
    const supportedTypes = {
      'application/pdf': {
        extension: '.pdf',
        description: 'PDF Document',
        maxSize: '10MB'
      },
      'text/plain': {
        extension: '.txt',
        description: 'Text File',
        maxSize: '10MB'
      },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        extension: '.docx',
        description: 'Microsoft Word Document (2007+)',
        maxSize: '10MB'
      },
      'application/msword': {
        extension: '.doc',
        description: 'Microsoft Word Document (Legacy)',
        maxSize: '10MB'
      }
    };

    res.json({
      success: true,
      supportedTypes: supportedTypes,
      maxFileSize: process.env.MAX_FILE_SIZE || 10485760,
      maxFiles: 5
    });

  } catch (error) {
    console.error('Get supported types error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// DELETE /api/files/:filename - Delete uploaded file
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found'
      });
    }

    fileProcessor.cleanupFile(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      error: 'File deletion failed',
      message: error.message
    });
  }
});

// GET /api/files/health - Health check for file service
router.get('/health', (req, res) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
    const dirExists = fs.existsSync(uploadDir);
    
    let stats = null;
    if (dirExists) {
      const files = fs.readdirSync(uploadDir);
      stats = {
        uploadDirectory: uploadDir,
        directoryExists: dirExists,
        fileCount: files.length,
        totalSize: files.reduce((total, file) => {
          try {
            const filePath = path.join(uploadDir, file);
            const fileStats = fs.statSync(filePath);
            return total + fileStats.size;
          } catch {
            return total;
          }
        }, 0)
      };
    }

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      maxFileSize: process.env.MAX_FILE_SIZE || 10485760,
      uploadDirectory: uploadDir,
      stats: stats
    });

  } catch (error) {
    console.error('File service health check error:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          message: `File size exceeds limit of ${fileProcessor.formatFileSize(parseInt(process.env.MAX_FILE_SIZE) || 10485760)}`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          message: 'Maximum 5 files allowed per upload'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
          message: 'Use "files" field for file uploads'
        });
      default:
        return res.status(400).json({
          error: 'File upload error',
          message: error.message
        });
    }
  }

  if (error.message.includes('Unsupported file type')) {
    return res.status(400).json({
      error: 'Unsupported file type',
      message: error.message
    });
  }

  next(error);
});

module.exports = router;