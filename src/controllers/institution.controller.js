const institutionService = require('../services/institution.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

exports.getInstitutions = asyncHandler(async (req, res) => {
  const { page, limit, sort, order, ...filters } = req.query;
  const result = await institutionService.getInstitutions(
    filters,
    { page, limit, sort, order }
  );
  res.json(
    ApiResponse.paginated('Institutions fetched successfully', result.data, result.meta)
  );
});

exports.getInstitutionById = asyncHandler(async (req, res) => {
  const institution = await institutionService.getInstitutionById(req.params.id);
  res.json(
    ApiResponse.success('Institution fetched successfully', institution)
  );
});

exports.createInstitution = asyncHandler(async (req, res) => {
  const institution = await institutionService.createInstitution(req.body);
  res.status(201).json(
    ApiResponse.created('Institution created successfully', institution)
  );
});

exports.getMyInstitution = asyncHandler(async (req, res) => {
  const institution = await institutionService.getInstitutionById(req.user.institution);
  res.json(
    ApiResponse.success('Institution fetched successfully', institution)
  );
});

exports.updateInstitution = asyncHandler(async (req, res) => {
  const institution = await institutionService.updateInstitution(
    req.params.id,
    req.body
  );
  res.json(
    ApiResponse.success('Institution updated successfully', institution)
  );
});

exports.updateMyInstitution = asyncHandler(async (req, res) => {
  const institution = await institutionService.updateInstitution(
    req.user.institution,
    req.body
  );
  res.json(
    ApiResponse.success('Institution updated successfully', institution)
  );
});

exports.getInstitutionStats = asyncHandler(async (req, res) => {
  const stats = await institutionService.getInstitutionStats(req.params.id);
  res.json(
    ApiResponse.success('Institution stats fetched successfully', stats)
  );
});

exports.getMyInstitutionStats = asyncHandler(async (req, res) => {
  const stats = await institutionService.getInstitutionStats(req.user.institution);
  res.json(
    ApiResponse.success('Institution stats fetched successfully', stats)
  );
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await institutionService.getDashboardStats(req.user.institution);
  res.json(
    ApiResponse.success('Dashboard stats fetched successfully', stats)
  );
});

// Public endpoint for admission form
exports.getPublicInstitutions = asyncHandler(async (req, res) => {
  const institutions = await institutionService.getPublicInstitutions();
  res.json(
    ApiResponse.success('Institutions fetched successfully', institutions)
  );
});
