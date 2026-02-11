/**
 * Global Upload Service
 * 
 * Handles all file uploads in the system with validation, storage, and cleanup.
 * Stores files as Base64 in MongoDB for simplicity (no external storage needed).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  FILE_TYPES,
  UPLOAD_DESTINATIONS,
  IMAGE_DIMENSIONS,
  getUploadPath,
  formatFileSize,
  isValidFileType,
  isValidFileSize,
  generateFileName
} = require('../config/upload.config');
const ApiError = require('./apiError');
const logger = require('./logger');

class UploadService {
  constructor() {
    this.initializeDirectories();
  }

  /**
   * Initialize upload directories
   */
  initializeDirectories() {
    Object.values(UPLOAD_DESTINATIONS).forEach(dest => {
      const dirPath = getUploadPath(dest);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Created upload directory: ${dirPath}`);
      }
    });
  }

  /**
   * Validate a file against specified type rules
   * @param {Object} file - Multer file object
   * @param {string} fileType - Type from FILE_TYPES (e.g., 'IMAGE', 'DOCUMENT')
   * @returns {Object} Validation result
   */
  validateFile(file, fileType = 'ANY') {
    const errors = [];
    const config = FILE_TYPES[fileType];

    if (!config) {
      errors.push(`Invalid file type category: ${fileType}`);
      return { valid: false, errors };
    }

    // Check file type
    if (fileType !== 'ANY' && !isValidFileType(file, fileType)) {
      errors.push(`Invalid file type. Allowed: ${config.description}`);
    }

    // Check file size
    if (!isValidFileSize(file, fileType)) {
      errors.push(`File too large. Maximum size: ${formatFileSize(config.maxSize)}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      fileInfo: {
        originalName: file.originalname,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        mimeType: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase()
      }
    };
  }

  /**
   * Convert file buffer to Base64 string for MongoDB storage
   * @param {Buffer} buffer - File buffer
   * @param {string} mimeType - File MIME type
   * @returns {string} Base64 data URL
   */
  bufferToBase64(buffer, mimeType) {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Process and prepare file for storage
   * @param {Object} file - Multer file object
   * @param {string} fileType - Type category for validation
   * @param {Object} options - Additional options
   * @returns {Object} Processed file data ready for MongoDB
   */
  async processFile(file, fileType = 'ANY', options = {}) {
    // Validate file
    const validation = this.validateFile(file, fileType);
    if (!validation.valid) {
      throw ApiError.badRequest(validation.errors.join(', '));
    }

    const { prefix = '', userId = null } = options;

    // Generate unique filename
    const fileName = generateFileName(file.originalname, prefix);
    const fileId = crypto.randomBytes(16).toString('hex');

    // Convert to Base64 for MongoDB storage
    const base64Data = this.bufferToBase64(file.buffer, file.mimetype);

    return {
      fileId,
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      extension: path.extname(file.originalname).toLowerCase(),
      base64: base64Data,
      uploadedBy: userId,
      uploadedAt: new Date()
    };
  }

  /**
   * Process profile image (avatar or cover)
   * @param {Object} file - Multer file object
   * @param {string} type - 'avatar' or 'cover'
   * @param {string} userId - User ID
   * @returns {Object} Processed image data
   */
  async processProfileImage(file, type = 'avatar', userId = null) {
    const fileType = type === 'cover' ? 'COVER_IMAGE' : 'PROFILE_IMAGE';
    
    const validation = this.validateFile(file, fileType);
    if (!validation.valid) {
      throw ApiError.badRequest(validation.errors.join(', '));
    }

    const base64Data = this.bufferToBase64(file.buffer, file.mimetype);

    return {
      data: base64Data,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
      uploadedAt: new Date()
    };
  }

  /**
   * Process multiple files
   * @param {Array} files - Array of Multer file objects
   * @param {string} fileType - Type category for validation
   * @param {Object} options - Additional options
   * @returns {Array} Array of processed file data
   */
  async processMultipleFiles(files, fileType = 'ANY', options = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const processed = await this.processFile(files[i], fileType, options);
        results.push(processed);
      } catch (error) {
        errors.push({
          index: i,
          fileName: files[i].originalname,
          error: error.message
        });
      }
    }

    return { results, errors };
  }

  /**
   * Get file type configuration
   * @param {string} fileType - Type category
   * @returns {Object} File type configuration
   */
  getFileTypeConfig(fileType) {
    return FILE_TYPES[fileType] || null;
  }

  /**
   * Get all available file types
   * @returns {Object} All file type configurations
   */
  getAllFileTypes() {
    return FILE_TYPES;
  }

  /**
   * Get upload destinations
   * @returns {Object} All upload destinations
   */
  getDestinations() {
    return UPLOAD_DESTINATIONS;
  }

  /**
   * Get image dimensions config
   * @returns {Object} Image dimension configurations
   */
  getImageDimensions() {
    return IMAGE_DIMENSIONS;
  }

  /**
   * Clean up old temporary files (call periodically)
   * @param {number} maxAgeHours - Maximum age in hours
   */
  async cleanupTempFiles(maxAgeHours = 24) {
    const tempDir = getUploadPath(UPLOAD_DESTINATIONS.TEMP);
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    try {
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} temporary files`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up temp files:', error);
      return 0;
    }
  }
}

module.exports = new UploadService();
