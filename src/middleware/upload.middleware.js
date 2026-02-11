/**
 * Upload Middleware
 * 
 * Multer configuration and middleware for handling file uploads.
 */

const multer = require('multer');
const { FILE_TYPES } = require('../config/upload.config');
const ApiError = require('../utils/apiError');

// Use memory storage for Base64 conversion
const storage = multer.memoryStorage();

// File filter factory
const createFileFilter = (fileType) => {
  return (req, file, cb) => {
    const config = FILE_TYPES[fileType];
    
    if (!config) {
      return cb(new ApiError(400, `Invalid file type category: ${fileType}`), false);
    }

    // If ANY type, allow all
    if (fileType === 'ANY') {
      return cb(null, true);
    }

    // Check MIME type
    if (config.mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Invalid file type. Allowed: ${config.description}`), false);
    }
  };
};

// Create multer instance for specific file type
const createUploader = (fileType, fieldName = 'file', maxCount = 1) => {
  const config = FILE_TYPES[fileType] || FILE_TYPES.ANY;
  
  const upload = multer({
    storage,
    fileFilter: createFileFilter(fileType),
    limits: {
      fileSize: config.maxSize,
      files: maxCount
    }
  });

  if (maxCount === 1) {
    return upload.single(fieldName);
  }
  return upload.array(fieldName, maxCount);
};

// Pre-configured uploaders
const uploaders = {
  // Single image upload
  singleImage: createUploader('IMAGE', 'image', 1),
  
  // Profile avatar upload
  profileAvatar: createUploader('PROFILE_IMAGE', 'avatar', 1),
  
  // Profile cover upload
  profileCover: createUploader('COVER_IMAGE', 'cover', 1),
  
  // Single document upload
  singleDocument: createUploader('DOCUMENT', 'document', 1),
  
  // Single PDF upload
  singlePdf: createUploader('PDF', 'pdf', 1),
  
  // Multiple images (up to 10)
  multipleImages: createUploader('IMAGE', 'images', 10),
  
  // Multiple documents (up to 5)
  multipleDocuments: createUploader('DOCUMENT', 'documents', 5),
  
  // Any single file
  anyFile: createUploader('ANY', 'file', 1)
};

// Custom uploader factory for specific needs
const customUploader = (options = {}) => {
  const {
    fileType = 'ANY',
    fieldName = 'file',
    maxCount = 1,
    maxSize = null
  } = options;

  const config = FILE_TYPES[fileType] || FILE_TYPES.ANY;
  
  return multer({
    storage,
    fileFilter: createFileFilter(fileType),
    limits: {
      fileSize: maxSize || config.maxSize,
      files: maxCount
    }
  });
};

// Handle multiple different file fields
const multiFieldUploader = (fields) => {
  // fields: [{ name: 'avatar', maxCount: 1, fileType: 'PROFILE_IMAGE' }, ...]
  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      const fieldConfig = fields.find(f => f.name === file.fieldname);
      if (!fieldConfig) {
        return cb(new ApiError(400, `Unknown field: ${file.fieldname}`), false);
      }
      
      const fileTypeConfig = FILE_TYPES[fieldConfig.fileType || 'ANY'];
      if (fieldConfig.fileType !== 'ANY' && !fileTypeConfig.mimeTypes.includes(file.mimetype)) {
        return cb(new ApiError(400, `Invalid file type for ${file.fieldname}. Allowed: ${fileTypeConfig.description}`), false);
      }
      
      cb(null, true);
    },
    limits: {
      fileSize: Math.max(...fields.map(f => (FILE_TYPES[f.fileType || 'ANY'] || FILE_TYPES.ANY).maxSize))
    }
  }).fields(fields.map(f => ({ name: f.name, maxCount: f.maxCount || 1 })));
};

// Error handler middleware for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        error: err.message
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: err.message
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field',
        error: err.message
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Upload error',
      error: err.message
    });
  }
  next(err);
};

module.exports = {
  uploaders,
  createUploader,
  customUploader,
  multiFieldUploader,
  handleUploadError
};
