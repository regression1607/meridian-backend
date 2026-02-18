const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router.route('/')
  .get(subjectController.getSubjects)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.TEACHER), subjectController.createSubject);

router.route('/:id')
  .get(subjectController.getSubjectById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.TEACHER), subjectController.updateSubject)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.TEACHER), subjectController.deleteSubject);

router.put('/:id/classes', 
  authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.TEACHER), 
  subjectController.assignToClasses
);

router.put('/:id/teachers', 
  authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.TEACHER), 
  subjectController.assignTeachers
);

module.exports = router;
