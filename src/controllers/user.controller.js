const userService = require('../services/user.service');
const idGeneratorService = require('../services/idGenerator.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit, sort, order, ...filters } = req.query;
  // Super admin and admin can see all users, others see only their institution
  const institutionId = ['super_admin', 'admin'].includes(req.user.role) 
    ? null 
    : req.user.institution;
  const result = await userService.getUsers(
    filters,
    { page, limit, sort, order },
    institutionId,
    req.user.role
  );
  res.json({
    success: true,
    message: 'Users fetched successfully',
    data: result.data,
    meta: result.meta,
    stats: result.stats
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const institutionId = ['super_admin', 'admin'].includes(req.user.role) 
    ? null 
    : req.user.institution;
  const user = await userService.getUserById(req.params.id, institutionId);
  res.json(
    ApiResponse.success('User fetched successfully', user)
  );
});

exports.getUserFullDetails = asyncHandler(async (req, res) => {
  const institutionId = ['super_admin', 'admin'].includes(req.user.role) 
    ? null 
    : req.user.institution;
  const details = await userService.getUserFullDetails(req.params.id, institutionId);
  res.json(
    ApiResponse.success('User details fetched successfully', details)
  );
});

exports.createUser = asyncHandler(async (req, res) => {
  // For super_admin/admin creating users, use institutionId from body if provided
  let institutionId = req.user.institution;
  if (['super_admin', 'admin'].includes(req.user.role) && req.body.institutionId) {
    institutionId = req.body.institutionId;
  }
  const user = await userService.createUser(
    req.body,
    institutionId,
    req.user._id,
    req.user.role
  );
  res.status(201).json(
    ApiResponse.created('User created successfully', user)
  );
});

exports.updateUser = asyncHandler(async (req, res) => {
  const institutionId = ['super_admin', 'admin'].includes(req.user.role) 
    ? null 
    : req.user.institution;
  const user = await userService.updateUser(
    req.params.id,
    req.body,
    institutionId
  );
  res.json(
    ApiResponse.success('User updated successfully', user)
  );
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const institutionId = ['super_admin', 'admin'].includes(req.user.role) 
    ? null 
    : req.user.institution;
  const result = await userService.deleteUser(req.params.id, institutionId);
  res.json(
    ApiResponse.success(result.message)
  );
});

exports.getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const result = await userService.getUsersByRole(
    role,
    req.user.institution,
    req.query
  );
  res.json(
    ApiResponse.paginated(`${role}s fetched successfully`, result.data, result.meta)
  );
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.json(
    ApiResponse.success('Profile updated successfully', user)
  );
});

exports.bulkImportUsers = asyncHandler(async (req, res) => {
  const { users, role } = req.body;
  
  if (!users || !Array.isArray(users) || users.length === 0) {
    return res.status(400).json(
      ApiResponse.error('No users data provided')
    );
  }

  if (!role) {
    return res.status(400).json(
      ApiResponse.error('Role is required')
    );
  }

  const institutionId = ['super_admin', 'admin'].includes(req.user.role)
    ? req.body.institutionId || req.user.institution
    : req.user.institution;

  const result = await userService.bulkImportUsers(
    users,
    institutionId,
    req.user._id,
    req.user.role
  );

  res.status(201).json(
    ApiResponse.success('Bulk import completed', result)
  );
});

exports.exportUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  
  const institutionId = ['super_admin', 'admin'].includes(req.user.role)
    ? null
    : req.user.institution;

  const users = await userService.exportUsers({ role }, institutionId);

  res.json(
    ApiResponse.success('Users exported successfully', users)
  );
});

// Unified ID Generator endpoint - generates IDs for all user types
exports.generateNextId = asyncHandler(async (req, res) => {
  const { idType, classId, sectionId } = req.query;
  
  const institutionId = ['super_admin', 'admin'].includes(req.user.role)
    ? req.query.institutionId
    : req.user.institution;

  if (!institutionId) {
    return res.status(400).json(
      ApiResponse.error('Institution ID is required')
    );
  }

  if (!idType) {
    return res.status(400).json(
      ApiResponse.error('ID type is required (admissionNumber, rollNumber, teacherEmployeeId, staffEmployeeId)')
    );
  }

  const result = await idGeneratorService.generateNextId(institutionId, idType, { classId, sectionId });
  res.json(
    ApiResponse.success(`Next ${idType} generated`, result)
  );
});

// Get ID generation settings for an institution
exports.getIdSettings = asyncHandler(async (req, res) => {
  const institutionId = ['super_admin', 'admin'].includes(req.user.role)
    ? req.query.institutionId
    : req.user.institution;

  if (!institutionId) {
    return res.status(400).json(
      ApiResponse.error('Institution ID is required')
    );
  }

  const result = await idGeneratorService.getSettings(institutionId);
  res.json(
    ApiResponse.success('ID generation settings fetched', result)
  );
});

// Update ID generation settings for an institution
exports.updateIdSettings = asyncHandler(async (req, res) => {
  const institutionId = ['super_admin', 'admin'].includes(req.user.role)
    ? req.body.institutionId
    : req.user.institution;

  if (!institutionId) {
    return res.status(400).json(
      ApiResponse.error('Institution ID is required')
    );
  }

  const result = await idGeneratorService.updateSettings(institutionId, req.body);
  res.json(
    ApiResponse.success('ID generation settings updated', result)
  );
});

// Legacy endpoints for backward compatibility
exports.getNextAdmissionNumber = asyncHandler(async (req, res) => {
  const institutionId = ['super_admin', 'admin'].includes(req.user.role)
    ? req.query.institutionId
    : req.user.institution;

  if (!institutionId) {
    return res.status(400).json(
      ApiResponse.error('Institution ID is required')
    );
  }

  const result = await idGeneratorService.generateNextId(institutionId, 'admissionNumber');
  res.json(
    ApiResponse.success('Next admission number generated', result)
  );
});

exports.getNextRollNumber = asyncHandler(async (req, res) => {
  const { classId, sectionId } = req.query;
  
  const institutionId = ['super_admin', 'admin'].includes(req.user.role)
    ? req.query.institutionId
    : req.user.institution;

  if (!institutionId) {
    return res.status(400).json(
      ApiResponse.error('Institution ID is required')
    );
  }

  if (!classId) {
    return res.status(400).json(
      ApiResponse.error('Class ID is required')
    );
  }

  const result = await idGeneratorService.generateNextId(institutionId, 'rollNumber', { classId, sectionId });
  res.json(
    ApiResponse.success('Next roll number generated', result)
  );
});

exports.getStudentNumberingSettings = asyncHandler(async (req, res) => {
  const institutionId = ['super_admin', 'admin'].includes(req.user.role)
    ? req.query.institutionId
    : req.user.institution;

  if (!institutionId) {
    return res.status(400).json(
      ApiResponse.error('Institution ID is required')
    );
  }

  const result = await idGeneratorService.getSettings(institutionId);
  res.json(
    ApiResponse.success('ID generation settings fetched', result)
  );
});

exports.updateStudentNumberingSettings = asyncHandler(async (req, res) => {
  const institutionId = ['super_admin', 'admin'].includes(req.user.role)
    ? req.body.institutionId
    : req.user.institution;

  if (!institutionId) {
    return res.status(400).json(
      ApiResponse.error('Institution ID is required')
    );
  }

  const result = await idGeneratorService.updateSettings(institutionId, { studentNumbering: req.body.settings });
  res.json(
    ApiResponse.success('ID generation settings updated', result)
  );
});
