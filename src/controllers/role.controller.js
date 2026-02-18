const roleService = require('../services/role.service');
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

// Get all roles
exports.getRoles = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await roleService.getRoles(institutionId, req.query);
  res.json(ApiResponse.paginated('Roles fetched successfully', result.data, result.pagination));
});

// Get role by ID
exports.getRoleById = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const role = await roleService.getRoleById(req.params.id, institutionId);
  res.json(ApiResponse.success('Role fetched successfully', role));
});

// Create a new role
exports.createRole = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const role = await roleService.createRole(req.body, institutionId, req.user._id);
  res.status(201).json(ApiResponse.created('Role created successfully', role));
});

// Update a role
exports.updateRole = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const role = await roleService.updateRole(req.params.id, req.body, institutionId);
  res.json(ApiResponse.success('Role updated successfully', role));
});

// Update role permissions
exports.updateRolePermissions = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const role = await roleService.updateRolePermissions(req.params.id, req.body, institutionId);
  res.json(ApiResponse.success('Role permissions updated successfully', role));
});

// Delete a role
exports.deleteRole = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  await roleService.deleteRole(req.params.id, institutionId);
  res.json(ApiResponse.success('Role deleted successfully'));
});

// Clone a role
exports.cloneRole = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const { newName } = req.body;
  
  if (!newName) {
    throw ApiError.badRequest('New role name is required');
  }
  
  const role = await roleService.cloneRole(req.params.id, newName, institutionId, req.user._id);
  res.status(201).json(ApiResponse.created('Role cloned successfully', role));
});

// Get users by role
exports.getUsersByRole = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const result = await roleService.getUsersByRole(req.params.id, institutionId, req.query);
  res.json(ApiResponse.paginated('Users fetched successfully', result.data, result.pagination));
});

// Initialize default roles for institution
exports.initializeDefaultRoles = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const roles = await roleService.createDefaultRoles(institutionId, req.user._id);
  res.status(201).json(ApiResponse.created('Default roles initialized successfully', roles));
});

// Get current user's permissions
exports.getMyPermissions = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const permissions = await roleService.getUserPermissions(req.user._id, institutionId);
  res.json(ApiResponse.success('Permissions fetched successfully', permissions));
});
