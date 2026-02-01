const timetableService = require('../services/timetable.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

// Helper to get institution ID from user (handles populated object or ID)
const getInstitutionId = (user, bodyInstitution) => {
  if (bodyInstitution) return bodyInstitution;
  if (user.institution && user.institution._id) return user.institution._id;
  return user.institution;
};

exports.getTimetables = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const timetables = await timetableService.getTimetables(institutionId, req.query);
  res.json(
    ApiResponse.success('Timetables fetched successfully', timetables)
  );
});

exports.getTimetableById = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const timetable = await timetableService.getTimetableById(req.params.id, institutionId);
  res.json(
    ApiResponse.success('Timetable fetched successfully', timetable)
  );
});

exports.getTimetableByClass = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.query.institution);
  const timetable = await timetableService.getTimetableByClass(
    req.params.classId,
    req.query.section,
    institutionId
  );
  res.json(
    ApiResponse.success('Timetable fetched successfully', timetable)
  );
});

exports.createTimetable = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const timetable = await timetableService.createTimetable(
    req.body,
    institutionId,
    req.user._id
  );
  res.status(201).json(
    ApiResponse.created('Timetable created successfully', timetable)
  );
});

exports.updateTimetable = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user, req.body.institution);
  const timetable = await timetableService.updateTimetable(
    req.params.id,
    req.body,
    institutionId
  );
  res.json(
    ApiResponse.success('Timetable updated successfully', timetable)
  );
});

exports.deleteTimetable = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const result = await timetableService.deleteTimetable(req.params.id, institutionId);
  res.json(
    ApiResponse.success(result.message)
  );
});

exports.getTeacherTimetable = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req.user);
  const teacherId = req.params.teacherId || req.user._id;
  const schedule = await timetableService.getTeacherTimetable(teacherId, institutionId);
  res.json(
    ApiResponse.success('Teacher timetable fetched successfully', schedule)
  );
});

exports.generateDefaultSchedule = asyncHandler(async (req, res) => {
  const { periodsPerDay = 8, dayStartTime = '08:00', periodDuration = 45 } = req.body;
  const schedule = timetableService.generateDefaultSchedule(periodsPerDay, dayStartTime, periodDuration);
  res.json(
    ApiResponse.success('Default schedule generated', schedule)
  );
});
