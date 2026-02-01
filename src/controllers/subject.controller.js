const subjectService = require('../services/subject.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

// Helper to get institution ID from user (handles populated object or ID)
const getInstitutionId = (user, bodyInstitution) => {
  if (bodyInstitution) return bodyInstitution;
  if (user.institution && user.institution._id) return user.institution._id;
  return user.institution;
};

exports.getSubjects = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await subjectService.getSubjects(institutionId, req.query);
  res.json(
    ApiResponse.paginated('Subjects fetched successfully', result.data, result.meta)
  );
});

exports.getSubjectById = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const subject = await subjectService.getSubjectById(req.params.id, institutionId);
  res.json(
    ApiResponse.success('Subject fetched successfully', subject)
  );
});

exports.createSubject = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const subject = await subjectService.createSubject(req.body, institutionId);
  res.status(201).json(
    ApiResponse.created('Subject created successfully', subject)
  );
});

exports.updateSubject = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const subject = await subjectService.updateSubject(req.params.id, req.body, institutionId);
  res.json(
    ApiResponse.success('Subject updated successfully', subject)
  );
});

exports.deleteSubject = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const result = await subjectService.deleteSubject(req.params.id, institutionId);
  res.json(
    ApiResponse.success(result.message)
  );
});

exports.assignToClasses = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const subject = await subjectService.assignToClasses(
    req.params.id,
    req.body.classIds,
    institutionId
  );
  res.json(
    ApiResponse.success('Subject assigned to classes successfully', subject)
  );
});

exports.assignTeachers = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const subject = await subjectService.assignTeachers(
    req.params.id,
    req.body.teacherIds,
    institutionId
  );
  res.json(
    ApiResponse.success('Teachers assigned successfully', subject)
  );
});
