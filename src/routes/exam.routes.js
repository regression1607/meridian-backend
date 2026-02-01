const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

// Exam routes
router.route('/exams')
  .get(examController.getExams)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR, ROLES.TEACHER), examController.createExam);

router.route('/exams/stats')
  .get(examController.getExamStats);

router.route('/exams/:id')
  .get(examController.getExamById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR, ROLES.TEACHER), examController.updateExam)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), examController.deleteExam);

// Result routes
router.route('/results')
  .get(examController.getResults)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR, ROLES.TEACHER), examController.createResult);

router.route('/results/bulk')
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR, ROLES.TEACHER), examController.createBulkResults);

router.route('/results/verify')
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), examController.verifyResults);

router.route('/results/student/:studentId')
  .get(examController.getStudentResults);

router.route('/results/:id')
  .get(examController.getResultById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR, ROLES.TEACHER), examController.updateResult)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), examController.deleteResult);

// Report Card routes
router.route('/report-cards')
  .get(examController.getReportCards);

router.route('/report-cards/generate')
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), examController.generateReportCard);

router.route('/report-cards/generate-bulk')
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), examController.generateBulkReportCards);

router.route('/report-cards/publish')
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), examController.publishReportCards);

router.route('/report-cards/student/:studentId')
  .get(examController.getStudentReportCard);

router.route('/report-cards/:id')
  .get(examController.getReportCardById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), examController.updateReportCard)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), examController.deleteReportCard);

module.exports = router;
