const attendanceService = require('../services/attendance.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');

// Helper to get institution ID from user or query params (for platform admins)
const getInstitutionId = (user, queryInstitution) => {
  const institutionId = user.institution || queryInstitution;
  if (!institutionId) {
    throw ApiError.badRequest('Institution ID is required');
  }
  return institutionId;
};

exports.markAttendance = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const result = await attendanceService.markAttendance(
    req.body,
    institutionId,
    req.user._id
  );
  res.status(201).json(
    ApiResponse.created('Attendance marked successfully', result)
  );
});

exports.markBulkAttendance = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const results = await attendanceService.markBulkAttendance(
    req.body,
    institutionId,
    req.user._id
  );
  res.json(
    ApiResponse.success('Bulk attendance processed', results)
  );
});

exports.getAttendance = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const attendance = await attendanceService.getAttendance(
    req.query,
    institutionId
  );
  res.json(
    ApiResponse.success('Attendance fetched successfully', attendance)
  );
});

exports.getAttendanceStats = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const stats = await attendanceService.getAttendanceStats(
    institutionId,
    req.query
  );
  res.json(
    ApiResponse.success('Attendance stats fetched successfully', stats)
  );
});

exports.getUserAttendance = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const { startDate, endDate } = req.query;
  const report = await attendanceService.getUserAttendanceReport(
    req.params.userId,
    institutionId,
    startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate || new Date()
  );
  res.json(
    ApiResponse.success('User attendance report fetched', report)
  );
});

exports.getClassAttendance = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const { classId } = req.params;
  const { sectionId, date } = req.query;
  
  const attendance = await attendanceService.getClassAttendance(
    classId,
    sectionId,
    date || new Date(),
    institutionId
  );
  res.json(
    ApiResponse.success('Class attendance fetched successfully', attendance)
  );
});

exports.getMyAttendance = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const { startDate, endDate } = req.query;
  const report = await attendanceService.getUserAttendanceReport(
    req.user._id,
    institutionId,
    startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate || new Date()
  );
  res.json(
    ApiResponse.success('Your attendance report fetched', report)
  );
});
