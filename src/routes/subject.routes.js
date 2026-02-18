const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(checkPermission('academics', 'view'), subjectController.getSubjects)
  .post(checkPermission('academics', 'create'), subjectController.createSubject);

router.route('/:id')
  .get(checkPermission('academics', 'view'), subjectController.getSubjectById)
  .put(checkPermission('academics', 'edit'), subjectController.updateSubject)
  .delete(checkPermission('academics', 'delete'), subjectController.deleteSubject);

router.put('/:id/classes', 
  checkPermission('academics', 'edit'), 
  subjectController.assignToClasses
);

router.put('/:id/teachers', 
  checkPermission('academics', 'edit'), 
  subjectController.assignTeachers
);

module.exports = router;
