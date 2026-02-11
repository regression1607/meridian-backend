const express = require('express');
const router = express.Router();
const feeController = require('../controllers/fee.controller');
const { protect, authorize, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

// Student can view their own fees
router.get('/me', feeController.getMyFees);

// Fee structures
router.route('/structures')
  .get(authorizeMinRole('teacher'), feeController.getFeeStructures)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN), feeController.createFeeStructure);

router.put('/structures/:id', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN), feeController.updateFeeStructure);

// Fee payments
router.get('/stats', authorizeMinRole('teacher'), feeController.getFeeStats);
router.get('/defaulters', authorizeMinRole('teacher'), feeController.getDefaulters);
router.get('/student/:studentId', authorizeMinRole('teacher'), feeController.getStudentFees);
router.get('/student/:studentId/dues', authorizeMinRole('teacher'), feeController.getStudentDues);

router.route('/payments')
  .get(authorizeMinRole('teacher'), feeController.getFeePayments)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.STAFF), feeController.recordPayment);

// Fee reminders
router.post('/payments/:paymentId/remind', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.STAFF), feeController.sendFeeReminder);
router.post('/payments/bulk-remind', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.STAFF), feeController.sendBulkFeeReminders);

// Update payment status
router.patch('/payments/:paymentId/status', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.STAFF), feeController.updatePaymentStatus);

// Generate monthly fees for all students
router.post('/generate', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN), feeController.generateMonthlyFees);

module.exports = router;
