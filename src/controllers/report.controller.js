const reportService = require('../services/report.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const getInstitutionId = (req) => {
  return req.user?.institution || req.query.institutionId || req.body.institutionId;
};

const reportController = {
  getStudentReport: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const report = await reportService.getStudentReport(institutionId);
    res.json(ApiResponse.success('Student report fetched', report));
  }),

  getStaffReport: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const report = await reportService.getStaffReport(institutionId);
    res.json(ApiResponse.success('Staff report fetched', report));
  }),

  getAttendanceReport: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const report = await reportService.getAttendanceReport(institutionId, req.query);
    res.json(ApiResponse.success('Attendance report fetched', report));
  }),

  getFeeReport: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const report = await reportService.getFeeReport(institutionId, req.query);
    res.json(ApiResponse.success('Fee report fetched', report));
  }),

  getLibraryReport: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const report = await reportService.getLibraryReport(institutionId);
    res.json(ApiResponse.success('Library report fetched', report));
  }),

  getPayrollReport: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const report = await reportService.getPayrollReport(institutionId, req.query);
    res.json(ApiResponse.success('Payroll report fetched', report));
  }),

  getDashboardSummary: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const summary = await reportService.getDashboardSummary(institutionId);
    res.json(ApiResponse.success('Dashboard summary fetched', summary));
  })
};

module.exports = reportController;
