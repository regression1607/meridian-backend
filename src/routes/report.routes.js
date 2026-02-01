const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.get('/dashboard', protect, reportController.getDashboardSummary);
router.get('/students', protect, authorizeMinRole(ROLES.COORDINATOR), reportController.getStudentReport);
router.get('/staff', protect, authorizeMinRole(ROLES.COORDINATOR), reportController.getStaffReport);
router.get('/attendance', protect, authorizeMinRole(ROLES.TEACHER), reportController.getAttendanceReport);
router.get('/fees', protect, authorizeMinRole(ROLES.COORDINATOR), reportController.getFeeReport);
router.get('/library', protect, authorizeMinRole(ROLES.COORDINATOR), reportController.getLibraryReport);
router.get('/payroll', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), reportController.getPayrollReport);

module.exports = router;
