const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Public route - Get classes for admission form
router.get('/public/:institutionId', classController.getPublicClasses);

// All other routes require authentication
router.use(protect);

// Class routes
router.route('/')
  .get(checkPermission('academics', 'view'), classController.getClasses)
  .post(checkPermission('academics', 'create'), classController.createClass);

router.route('/:id')
  .get(checkPermission('academics', 'view'), classController.getClassById)
  .put(checkPermission('academics', 'edit'), classController.updateClass)
  .delete(checkPermission('academics', 'delete'), classController.deleteClass);

router.get('/:id/students', checkPermission('academics', 'view'), classController.getClassStudents);

// Section routes
router.route('/:classId/sections')
  .get(checkPermission('academics', 'view'), classController.getSections)
  .post(checkPermission('academics', 'create'), classController.createSection);

router.route('/sections/:sectionId')
  .put(checkPermission('academics', 'edit'), classController.updateSection)
  .delete(checkPermission('academics', 'delete'), classController.deleteSection);

module.exports = router;
