const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Public route - Get classes for admission form
router.get('/public/:institutionId', classController.getPublicClasses);

// All other routes require authentication
router.use(protect);

// Class routes
router.route('/')
  .get(classController.getClasses)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN), classController.createClass);

router.route('/:id')
  .get(classController.getClassById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN), classController.updateClass)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN), classController.deleteClass);

router.get('/:id/students', classController.getClassStudents);

// Section routes
router.route('/:classId/sections')
  .get(classController.getSections)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN), classController.createSection);

router.route('/sections/:sectionId')
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN), classController.updateSection)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN), classController.deleteSection);

module.exports = router;
