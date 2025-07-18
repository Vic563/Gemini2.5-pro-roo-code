const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class FileProcessor {
  constructor() {
    this.supportedTypes = {
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc'
    };
  }

  // Check if file type is supported
  isSupported(mimetype) {
    return this.supportedTypes.hasOwnProperty(mimetype);
  }

  // Get file type from mimetype
  getFileType(mimetype) {
    return this.supportedTypes[mimetype] || 'unknown';
  }

  // Main method to extract content from file
  async extractContent(filePath, mimetype) {
    try {
      const fileType = this.getFileType(mimetype);
      
      if (!this.isSupported(mimetype)) {
        throw new Error(`Unsupported file type: ${mimetype}`);
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('File is empty');
      }

      // Maximum file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (stats.size > maxSize) {
        throw new Error(`File too large: ${this.formatFileSize(stats.size)} (max: ${this.formatFileSize(maxSize)})`);
      }

      let content = '';
      
      switch (fileType) {
        case 'pdf':
          content = await this.extractPDF(filePath);
          break;
        case 'txt':
          content = await this.extractTXT(filePath);
          break;
        case 'docx':
          content = await this.extractDOCX(filePath);
          break;
        case 'doc':
          // For .doc files, we'll treat them as binary and try to extract what we can
          // Note: This is limited support for older .doc format
          content = await this.extractDOC(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      return {
        content: content.trim(),
        fileType: fileType,
        fileSize: stats.size,
        wordCount: this.countWords(content),
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error extracting file content:', error);
      throw error;
    }
  }

  // Extract content from PDF files
  async extractPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF appears to be empty or contains only images');
      }
      
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract PDF content: ${error.message}`);
    }
  }

  // Extract content from TXT files
  async extractTXT(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (!content || content.trim().length === 0) {
        throw new Error('Text file is empty');
      }
      
      return content;
    } catch (error) {
      console.error('TXT extraction error:', error);
      throw new Error(`Failed to extract text file content: ${error.message}`);
    }
  }

  // Extract content from DOCX files
  async extractDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX file appears to be empty');
      }
      
      // Log any warnings
      if (result.messages && result.messages.length > 0) {
        console.warn('DOCX extraction warnings:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error(`Failed to extract DOCX content: ${error.message}`);
    }
  }

  // Basic extraction for DOC files (limited support)
  async extractDOC(filePath) {
    try {
      // For older .doc files, we'll try to use mammoth as well
      // This might not work perfectly but it's better than nothing
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOC file appears to be empty or could not be processed');
      }
      
      return result.value;
    } catch (error) {
      console.error('DOC extraction error:', error);
      throw new Error(`Failed to extract DOC content: ${error.message}. Consider converting to DOCX format.`);
    }
  }

  // Clean up extracted content
  cleanContent(content) {
    return content
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
  }

  // Count words in content
  countWords(content) {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate file before processing
  validateFile(file) {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    if (!file.mimetype) {
      errors.push('File type not detected');
    } else if (!this.isSupported(file.mimetype)) {
      errors.push(`Unsupported file type: ${file.mimetype}`);
    }

    if (!file.size || file.size === 0) {
      errors.push('File is empty');
    } else if (file.size > 10 * 1024 * 1024) {
      errors.push(`File too large: ${this.formatFileSize(file.size)} (max: 10MB)`);
    }

    if (!file.filename) {
      errors.push('Filename not provided');
    }

    return errors;
  }

  // Get file info without extracting content
  getFileInfo(file) {
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      formattedSize: this.formatFileSize(file.size),
      fileType: this.getFileType(file.mimetype),
      isSupported: this.isSupported(file.mimetype)
    };
  }

  // Clean up uploaded file
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
    }
  }
}

module.exports = new FileProcessor();