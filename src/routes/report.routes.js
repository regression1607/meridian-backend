const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, checkPermission('reports', 'view'), reportController.getDashboardSummary);
router.get('/students', protect, checkPermission('reports', 'view'), reportController.getStudentReport);
router.get('/staff', protect, checkPermission('reports', 'view'), reportController.getStaffReport);
router.get('/attendance', protect, checkPermission('reports', 'view'), reportController.getAttendanceReport);
router.get('/fees', protect, checkPermission('reports', 'view'), reportController.getFeeReport);
router.get('/library', protect, checkPermission('reports', 'view'), reportController.getLibraryReport);
router.get('/payroll', protect, checkPermission('reports', 'view'), reportController.getPayrollReport);
router.get('/teacher-classes', protect, checkPermission('reports', 'view'), reportController.getTeacherClasses);

module.exports = router;
