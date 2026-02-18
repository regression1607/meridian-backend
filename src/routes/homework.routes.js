const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homework.controller');
const { protect, authorizeMinRole, checkPermission } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Student routes
router.get('/my-homework', checkPermission('homework', 'view'), homeworkController.getStudentHomework);
router.post('/:id/submit', checkPermission('homework', 'create'), homeworkController.submitHomework);

// Routes accessible to users with homework view permission
router.get('/stats', checkPermission('homework', 'view'), homeworkController.getHomeworkStats);
router.get('/', checkPermission('homework', 'view'), homeworkController.getHomework);
router.get('/:id', checkPermission('homework', 'view'), homeworkController.getHomeworkById);

// Teacher/Admin only routes - require create/edit/delete permissions
router.post('/', checkPermission('homework', 'create'), homeworkController.createHomework);
router.put('/:id', checkPermission('homework', 'edit'), homeworkController.updateHomework);
router.delete('/:id', checkPermission('homework', 'delete'), homeworkController.deleteHomework);
router.post('/:id/grade/:studentId', checkPermission('homework', 'manage'), homeworkController.gradeSubmission);

module.exports = router;
