const express = require('express');
const router = express.Router();
const feeController = require('../controllers/fee.controller');
const { protect, authorize, authorizeMinRole, checkPermission } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

// Student can view their own fees
router.get('/me', checkPermission('fee_management', 'view'), feeController.getMyFees);

// Fee structures
router.route('/structures')
  .get(checkPermission('fee_management', 'view'), feeController.getFeeStructures)
  .post(checkPermission('fee_management', 'create'), feeController.createFeeStructure);

router.put('/structures/:id', checkPermission('fee_management', 'edit'), feeController.updateFeeStructure);

// Fee payments
router.get('/stats', checkPermission('fee_management', 'view'), feeController.getFeeStats);
router.get('/defaulters', checkPermission('fee_management', 'view'), feeController.getDefaulters);
router.get('/student/:studentId', checkPermission('fee_management', 'view'), feeController.getStudentFees);
router.get('/student/:studentId/dues', checkPermission('fee_management', 'view'), feeController.getStudentDues);

router.route('/payments')
  .get(checkPermission('fee_management', 'view'), feeController.getFeePayments)
  .post(checkPermission('fee_management', 'create'), feeController.recordPayment);

// Fee reminders
router.post('/payments/:paymentId/remind', checkPermission('fee_management', 'manage'), feeController.sendFeeReminder);
router.post('/payments/bulk-remind', checkPermission('fee_management', 'manage'), feeController.sendBulkFeeReminders);

// Update payment status
router.patch('/payments/:paymentId/status', checkPermission('fee_management', 'edit'), feeController.updatePaymentStatus);

// Generate monthly fees for all students
router.post('/generate', checkPermission('fee_management', 'manage'), feeController.generateMonthlyFees);

module.exports = router;
