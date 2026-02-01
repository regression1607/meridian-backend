const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homework.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Student routes
router.get('/my-homework', homeworkController.getStudentHomework);
router.post('/:id/submit', homeworkController.submitHomework);

// Teacher/Admin routes
router.get('/stats', authorizeMinRole('teacher'), homeworkController.getHomeworkStats);
router.get('/', authorizeMinRole('teacher'), homeworkController.getHomework);
router.get('/:id', homeworkController.getHomeworkById);
router.post('/', authorizeMinRole('teacher'), homeworkController.createHomework);
router.put('/:id', authorizeMinRole('teacher'), homeworkController.updateHomework);
router.delete('/:id', authorizeMinRole('teacher'), homeworkController.deleteHomework);
router.post('/:id/grade/:studentId', authorizeMinRole('teacher'), homeworkController.gradeSubmission);

module.exports = router;
