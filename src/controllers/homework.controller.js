const homeworkService = require('../services/homework.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');

const getInstitutionId = (user, queryInstitution) => {
  const institutionId = user.institution || queryInstitution;
  if (!institutionId) {
    throw ApiError.badRequest('Institution ID is required');
  }
  return institutionId;
};

exports.createHomework = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const homework = await homeworkService.createHomework(
    req.body,
    institutionId,
    req.user._id
  );
  res.status(201).json(
    ApiResponse.created('Homework created successfully', homework)
  );
});

exports.getHomework = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await homeworkService.getHomework(req.query, institutionId);
  res.json(
    ApiResponse.success('Homework fetched successfully', result.data, result.pagination)
  );
});

exports.getHomeworkById = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const homework = await homeworkService.getHomeworkById(
    req.params.id,
    institutionId
  );
  res.json(
    ApiResponse.success('Homework fetched successfully', homework)
  );
});

exports.updateHomework = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const homework = await homeworkService.updateHomework(
    req.params.id,
    req.body,
    institutionId
  );
  res.json(
    ApiResponse.success('Homework updated successfully', homework)
  );
});

exports.deleteHomework = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  await homeworkService.deleteHomework(req.params.id, institutionId);
  res.json(
    ApiResponse.success('Homework deleted successfully')
  );
});

exports.submitHomework = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const homework = await homeworkService.submitHomework(
    req.params.id,
    req.user._id,
    req.body,
    institutionId
  );
  res.json(
    ApiResponse.success('Homework submitted successfully', homework)
  );
});

exports.gradeSubmission = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const homework = await homeworkService.gradeSubmission(
    req.params.id,
    req.params.studentId,
    req.body,
    req.user._id,
    institutionId
  );
  res.json(
    ApiResponse.success('Submission graded successfully', homework)
  );
});

exports.getStudentHomework = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const homework = await homeworkService.getStudentHomework(
    req.user._id,
    institutionId,
    req.query
  );
  res.json(
    ApiResponse.success('Student homework fetched successfully', homework)
  );
});

exports.getHomeworkStats = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const stats = await homeworkService.getHomeworkStats(institutionId, req.query);
  res.json(
    ApiResponse.success('Homework stats fetched successfully', stats)
  );
});
