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

router.route('/payments')
  .get(authorizeMinRole('teacher'), feeController.getFeePayments)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.STAFF), feeController.recordPayment);

module.exports = router;
