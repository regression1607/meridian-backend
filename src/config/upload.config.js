/**
 * Global Upload Configuration
 * 
 * This configuration defines all upload settings for the entire system.
 * Use this config when implementing any file upload functionality.
 */

const path = require('path');

// Base upload directory
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || 'uploads';

// File type categories with their allowed extensions and MIME types
const FILE_TYPES = {
  // Images
  IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: 'Image files (JPG, PNG, GIF, WebP, SVG)'
  },

  // Profile Images (smaller limit for avatars)
  PROFILE_IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ],
    maxSize: 2 * 1024 * 1024, // 2MB
    description: 'Profile images (JPG, PNG, WebP)'
  },

  // Cover/Background Images
  COVER_IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: 'Cover/Background images (JPG, PNG, WebP)'
  },

  // Documents
  DOCUMENT: {
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT)'
  },

  // PDF Only
  PDF: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'PDF files only'
  },

  // Spreadsheets
  SPREADSHEET: {
    extensions: ['.xls', '.xlsx', '.csv'],
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Spreadsheets (XLS, XLSX, CSV)'
  },

  // Audio
  AUDIO: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    mimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    description: 'Audio files (MP3, WAV, OGG, M4A)'
  },

  // Video
  VIDEO: {
    extensions: ['.mp4', '.webm', '.mov', '.avi'],
    mimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo'
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    description: 'Video files (MP4, WebM, MOV, AVI)'
  },

  // Any file (use with caution)
  ANY: {
    extensions: [],
    mimeTypes: [],
    maxSize: 50 * 1024 * 1024, // 50MB
    description: 'Any file type'
  }
};

// Upload destinations/folders
const UPLOAD_DESTINATIONS = {
  PROFILE_AVATARS: 'avatars',
  PROFILE_COVERS: 'covers',
  DOCUMENTS: 'documents',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
  RESOURCES: 'resources',
  ANNOUNCEMENTS: 'announcements',
  CERTIFICATES: 'certificates',
  REPORTS: 'reports',
  TEMP: 'temp'
};

// Image dimensions for resizing
const IMAGE_DIMENSIONS = {
  AVATAR: {
    width: 200,
    height: 200,
    fit: 'cover'
  },
  AVATAR_THUMBNAIL: {
    width: 50,
    height: 50,
    fit: 'cover'
  },
  COVER: {
    width: 1200,
    height: 400,
    fit: 'cover'
  },
  THUMBNAIL: {
    width: 150,
    height: 150,
    fit: 'cover'
  },
  MEDIUM: {
    width: 600,
    height: 600,
    fit: 'inside'
  },
  LARGE: {
    width: 1200,
    height: 1200,
    fit: 'inside'
  }
};

// Utility functions
const getUploadPath = (destination) => {
  return path.join(UPLOAD_BASE_DIR, destination);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isValidFileType = (file, fileType) => {
  const config = FILE_TYPES[fileType];
  if (!config) return false;
  
  // If ANY type, allow all
  if (fileType === 'ANY') return true;
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  
  return config.extensions.includes(ext) && config.mimeTypes.includes(mime);
};

const isValidFileSize = (file, fileType) => {
  const config = FILE_TYPES[fileType];
  if (!config) return false;
  
  return file.size <= config.maxSize;
};

const generateFileName = (originalName, prefix = '') => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}-${randomStr}${ext}`;
};

module.exports = {
  UPLOAD_BASE_DIR,
  FILE_TYPES,
  UPLOAD_DESTINATIONS,
  IMAGE_DIMENSIONS,
  getUploadPath,
  formatFileSize,
  isValidFileType,
  isValidFileSize,
  generateFileName
};
