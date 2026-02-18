const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homework.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Student routes
router.get('/my-homework', homeworkController.getStudentHomework);
router.post('/:id/submit', homeworkController.submitHomework);

// Routes accessible to all authenticated users (students can view homework list)
router.get('/stats', homeworkController.getHomeworkStats);
router.get('/', homeworkController.getHomework);
router.get('/:id', homeworkController.getHomeworkById);

// Teacher/Admin only routes
router.post('/', authorizeMinRole('teacher'), homeworkController.createHomework);
router.put('/:id', authorizeMinRole('teacher'), homeworkController.updateHomework);
router.delete('/:id', authorizeMinRole('teacher'), homeworkController.deleteHomework);
router.post('/:id/grade/:studentId', authorizeMinRole('teacher'), homeworkController.gradeSubmission);

module.exports = router;
