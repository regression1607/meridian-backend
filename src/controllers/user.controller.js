const userService = require('../services/user.service');
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
  res.json(
    ApiResponse.paginated('Users fetched successfully', result.data, result.meta)
  );
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
