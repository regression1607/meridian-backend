const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

// Exam routes
router.route('/exams')
  .get(checkPermission('examinations', 'view'), examController.getExams)
  .post(checkPermission('examinations', 'create'), examController.createExam);

router.route('/exams/stats')
  .get(checkPermission('examinations', 'view'), examController.getExamStats);

router.route('/exams/:id')
  .get(checkPermission('examinations', 'view'), examController.getExamById)
  .put(checkPermission('examinations', 'edit'), examController.updateExam)
  .delete(checkPermission('examinations', 'delete'), examController.deleteExam);

// Result routes
router.route('/results')
  .get(checkPermission('examinations', 'view'), examController.getResults)
  .post(checkPermission('examinations', 'create'), examController.createResult);

router.route('/results/bulk')
  .post(checkPermission('examinations', 'create'), examController.createBulkResults);

router.route('/results/verify')
  .post(checkPermission('examinations', 'manage'), examController.verifyResults);

router.route('/results/student/:studentId')
  .get(checkPermission('examinations', 'view'), examController.getStudentResults);

router.route('/results/:id')
  .get(checkPermission('examinations', 'view'), examController.getResultById)
  .put(checkPermission('examinations', 'edit'), examController.updateResult)
  .delete(checkPermission('examinations', 'delete'), examController.deleteResult);

// Report Card routes
router.route('/report-cards')
  .get(checkPermission('examinations', 'view'), examController.getReportCards);

router.route('/report-cards/generate')
  .post(checkPermission('examinations', 'manage'), examController.generateReportCard);

router.route('/report-cards/generate-bulk')
  .post(checkPermission('examinations', 'manage'), examController.generateBulkReportCards);

router.route('/report-cards/publish')
  .post(checkPermission('examinations', 'manage'), examController.publishReportCards);

router.route('/report-cards/student/:studentId')
  .get(checkPermission('examinations', 'view'), examController.getStudentReportCard);

router.route('/report-cards/:id')
  .get(checkPermission('examinations', 'view'), examController.getReportCardById)
  .put(checkPermission('examinations', 'edit'), examController.updateReportCard)
  .delete(checkPermission('examinations', 'delete'), examController.deleteReportCard);

module.exports = router;
