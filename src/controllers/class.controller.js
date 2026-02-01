const classService = require('../services/class.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const ApiError = require('../utils/apiError');

// Helper to get institution ID from user (handles populated object or ID)
const getInstitutionId = (user, bodyInstitution, required = true) => {
  // If institution passed in body/query (for super_admin managing multiple institutions)
  if (bodyInstitution) return bodyInstitution;
  // If user.institution is populated object
  if (user.institution && user.institution._id) return user.institution._id;
  // If user.institution is just the ID
  if (user.institution) return user.institution;
  // No institution found
  if (required) {
    throw ApiError.badRequest('Institution ID is required. Please specify an institution.');
  }
  return null;
};

// Class controllers
exports.getClasses = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await classService.getClasses(institutionId, req.query);
  res.json(
    ApiResponse.paginated('Classes fetched successfully', result.data, result.meta)
  );
});

exports.getClassById = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const classDoc = await classService.getClassById(req.params.id, institutionId);
  res.json(
    ApiResponse.success('Class fetched successfully', classDoc)
  );
});

exports.createClass = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const classDoc = await classService.createClass(req.body, institutionId);
  res.status(201).json(
    ApiResponse.created('Class created successfully', classDoc)
  );
});

exports.updateClass = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const classDoc = await classService.updateClass(req.params.id, req.body, institutionId);
  res.json(
    ApiResponse.success('Class updated successfully', classDoc)
  );
});

exports.deleteClass = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await classService.deleteClass(req.params.id, institutionId);
  res.json(
    ApiResponse.success(result.message)
  );
});

exports.getClassStudents = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const students = await classService.getClassStudents(
    req.params.id,
    req.query.section,
    institutionId
  );
  res.json(
    ApiResponse.success('Students fetched successfully', students)
  );
});

// Section controllers
exports.getSections = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const sections = await classService.getSections(req.params.classId, institutionId);
  res.json(
    ApiResponse.success('Sections fetched successfully', sections)
  );
});

exports.createSection = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const section = await classService.createSection(
    req.params.classId,
    req.body,
    institutionId
  );
  res.status(201).json(
    ApiResponse.created('Section created successfully', section)
  );
});

exports.updateSection = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const section = await classService.updateSection(
    req.params.sectionId,
    req.body,
    institutionId
  );
  res.json(
    ApiResponse.success('Section updated successfully', section)
  );
});

exports.deleteSection = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await classService.deleteSection(req.params.sectionId, institutionId);
  res.json(
    ApiResponse.success(result.message)
  );
});

// Public endpoint for admission form
exports.getPublicClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getPublicClasses(req.params.institutionId);
  res.json(
    ApiResponse.success('Classes fetched successfully', classes)
  );
});
