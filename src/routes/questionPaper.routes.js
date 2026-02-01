const express = require('express');
const router = express.Router();
const multer = require('multer');
const questionPaperController = require('../controllers/questionPaper.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

router.use(protect);

// Get all question papers
router.get('/', questionPaperController.getQuestionPapers);

// Generate new question paper with AI
router.post(
  '/generate',
  authorizeMinRole(ROLES.TEACHER),
  upload.single('referencePdf'),
  questionPaperController.generateQuestionPaper
);

// Extract text from PDF (preview before generation)
router.post(
  '/extract-pdf',
  authorizeMinRole(ROLES.TEACHER),
  upload.single('pdf'),
  questionPaperController.extractPDFText
);

// Get single question paper
router.get('/:id', questionPaperController.getQuestionPaperById);

// Regenerate question paper
router.post(
  '/:id/regenerate',
  authorizeMinRole(ROLES.TEACHER),
  questionPaperController.regenerateQuestionPaper
);

// Update question paper (for editing)
router.put('/:id', authorizeMinRole(ROLES.TEACHER), questionPaperController.updateQuestionPaper);

// Delete question paper
router.delete('/:id', authorizeMinRole(ROLES.TEACHER), questionPaperController.deleteQuestionPaper);

module.exports = router;
