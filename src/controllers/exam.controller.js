const examService = require('../services/exam.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');

const getInstitutionId = (user, bodyInstitution, required = true) => {
  if (bodyInstitution) return bodyInstitution;
  if (user.institution && user.institution._id) return user.institution._id;
  if (user.institution) return user.institution;
  if (required) throw ApiError.badRequest('Institution ID is required');
  return null;
};

// Exam Controllers
exports.getExams = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await examService.getExams(institutionId, req.query);
  res.json(ApiResponse.paginated('Exams fetched successfully', result.data, result.meta));
});

exports.getExamById = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const exam = await examService.getExamById(req.params.id, institutionId);
  res.json(ApiResponse.success('Exam fetched successfully', exam));
});

exports.createExam = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const exam = await examService.createExam({ ...req.body, createdBy: req.user._id }, institutionId);
  res.status(201).json(ApiResponse.created('Exam created successfully', exam));
});

exports.updateExam = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const exam = await examService.updateExam(req.params.id, req.body, institutionId);
  res.json(ApiResponse.success('Exam updated successfully', exam));
});

exports.deleteExam = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  await examService.deleteExam(req.params.id, institutionId);
  res.json(ApiResponse.success('Exam deleted successfully'));
});

// Result Controllers
exports.getResults = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await examService.getResults(institutionId, req.query);
  res.json(ApiResponse.paginated('Results fetched successfully', result.data, result.meta));
});

exports.getResultById = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await examService.getResultById(req.params.id, institutionId);
  res.json(ApiResponse.success('Result fetched successfully', result));
});

exports.getStudentResults = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const results = await examService.getStudentResults(req.params.studentId, institutionId, req.query);
  res.json(ApiResponse.success('Student results fetched successfully', results));
});

exports.createResult = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const result = await examService.createResult({ ...req.body, enteredBy: req.user._id }, institutionId);
  res.status(201).json(ApiResponse.created('Result created successfully', result));
});

exports.createBulkResults = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const results = await examService.createBulkResults(req.body.results, req.user._id, institutionId);
  res.status(201).json(ApiResponse.created('Results created successfully', results));
});

exports.updateResult = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const result = await examService.updateResult(req.params.id, req.body, institutionId);
  res.json(ApiResponse.success('Result updated successfully', result));
});

exports.deleteResult = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  await examService.deleteResult(req.params.id, institutionId);
  res.json(ApiResponse.success('Result deleted successfully'));
});

exports.verifyResults = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const results = await examService.verifyResults(req.body.resultIds, req.user._id, institutionId);
  res.json(ApiResponse.success('Results verified successfully', results));
});

// Report Card Controllers
exports.getReportCards = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await examService.getReportCards(institutionId, req.query);
  res.json(ApiResponse.paginated('Report cards fetched successfully', result.data, result.meta));
});

exports.getReportCardById = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const reportCard = await examService.getReportCardById(req.params.id, institutionId);
  res.json(ApiResponse.success('Report card fetched successfully', reportCard));
});

exports.getStudentReportCard = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const reportCard = await examService.getStudentReportCard(req.params.studentId, institutionId, req.query);
  res.json(ApiResponse.success('Student report card fetched successfully', reportCard));
});

exports.generateReportCard = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const reportCard = await examService.generateReportCard(req.body, req.user._id, institutionId);
  res.status(201).json(ApiResponse.created('Report card generated successfully', reportCard));
});

exports.generateBulkReportCards = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const reportCards = await examService.generateBulkReportCards(req.body, req.user._id, institutionId);
  res.status(201).json(ApiResponse.created('Report cards generated successfully', reportCards));
});

exports.updateReportCard = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const reportCard = await examService.updateReportCard(req.params.id, req.body, institutionId);
  res.json(ApiResponse.success('Report card updated successfully', reportCard));
});

exports.publishReportCards = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const reportCards = await examService.publishReportCards(req.body.reportCardIds, req.user._id, institutionId);
  res.json(ApiResponse.success('Report cards published successfully', reportCards));
});

exports.deleteReportCard = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  await examService.deleteReportCard(req.params.id, institutionId);
  res.json(ApiResponse.success('Report card deleted successfully'));
});

// Statistics
exports.getExamStats = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const stats = await examService.getExamStats(institutionId, req.query);
  res.json(ApiResponse.success('Exam statistics fetched successfully', stats));
});
