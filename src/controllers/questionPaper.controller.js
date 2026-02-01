const questionPaperService = require('../services/questionPaper.service');
const asyncHandler = require('../utils/asyncHandler');

exports.generateQuestionPaper = asyncHandler(async (req, res) => {
  const config = req.body;
  
  // Parse questionTypes if it's a string (from FormData)
  if (typeof config.questionTypes === 'string') {
    config.questionTypes = JSON.parse(config.questionTypes);
  }
  
  // Handle PDF file if uploaded
  if (req.file) {
    const extractedText = await questionPaperService.extractTextFromPDF(req.file.buffer);
    config.referenceText = extractedText;
    config.referenceFileName = req.file.originalname;
  }

  const paper = await questionPaperService.generateQuestionPaper(
    config,
    req.user._id,
    req.user.institution
  );

  res.status(201).json({
    success: true,
    message: 'Question paper generated successfully',
    data: paper
  });
});

exports.regenerateQuestionPaper = asyncHandler(async (req, res) => {
  const paper = await questionPaperService.regenerateQuestionPaper(
    req.params.id,
    req.user._id,
    req.user.institution
  );

  res.json({
    success: true,
    message: 'Question paper regenerated successfully',
    data: paper
  });
});

exports.getQuestionPapers = asyncHandler(async (req, res) => {
  const result = await questionPaperService.getQuestionPapers(
    req.user.institution,
    req.query
  );

  res.json({
    success: true,
    data: result.papers,
    pagination: result.pagination
  });
});

exports.getQuestionPaperById = asyncHandler(async (req, res) => {
  const paper = await questionPaperService.getQuestionPaperById(
    req.params.id,
    req.user.institution
  );

  if (!paper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found'
    });
  }

  res.json({ success: true, data: paper });
});

exports.updateQuestionPaper = asyncHandler(async (req, res) => {
  const paper = await questionPaperService.updateQuestionPaper(
    req.params.id,
    req.body,
    req.user.institution
  );

  if (!paper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found'
    });
  }

  res.json({
    success: true,
    message: 'Question paper updated successfully',
    data: paper
  });
});

exports.deleteQuestionPaper = asyncHandler(async (req, res) => {
  const paper = await questionPaperService.deleteQuestionPaper(
    req.params.id,
    req.user.institution
  );

  if (!paper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found'
    });
  }

  res.json({
    success: true,
    message: 'Question paper deleted successfully'
  });
});

exports.extractPDFText = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No PDF file uploaded'
    });
  }

  const extractedText = await questionPaperService.extractTextFromPDF(req.file.buffer);

  res.json({
    success: true,
    data: {
      fileName: req.file.originalname,
      text: extractedText,
      wordCount: extractedText.split(/\s+/).length
    }
  });
});
