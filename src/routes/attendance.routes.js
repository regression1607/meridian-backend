const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect, authorize, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// Get my attendance (for students/teachers)
router.get('/me', attendanceController.getMyAttendance);

// Get attendance stats
router.get('/stats', authorizeMinRole('teacher'), attendanceController.getAttendanceStats);

// Get class attendance for marking
router.get('/class/:classId', authorizeMinRole('teacher'), attendanceController.getClassAttendance);

// Get user's attendance report
router.get('/user/:userId', authorizeMinRole('teacher'), attendanceController.getUserAttendance);

// Mark single attendance
router.post('/', authorizeMinRole('teacher'), attendanceController.markAttendance);

// Mark bulk attendance
router.post('/bulk', authorizeMinRole('teacher'), attendanceController.markBulkAttendance);

// Get attendance records
router.get('/', authorizeMinRole('teacher'), attendanceController.getAttendance);

module.exports = router;
