const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect, authorize, authorizeMinRole, checkPermission } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// Get my attendance (for students/teachers)
router.get('/me', checkPermission('attendance', 'view'), attendanceController.getMyAttendance);

// Get attendance stats
router.get('/stats', checkPermission('attendance', 'view'), attendanceController.getAttendanceStats);

// Get class attendance for marking
router.get('/class/:classId', checkPermission('attendance', 'view'), attendanceController.getClassAttendance);

// Get user's attendance report
router.get('/user/:userId', checkPermission('attendance', 'view'), attendanceController.getUserAttendance);

// Mark single attendance
router.post('/', checkPermission('attendance', 'create'), attendanceController.markAttendance);

// Mark bulk attendance
router.post('/bulk', checkPermission('attendance', 'create'), attendanceController.markBulkAttendance);

// Get attendance records
router.get('/', checkPermission('attendance', 'view'), attendanceController.getAttendance);

module.exports = router;
