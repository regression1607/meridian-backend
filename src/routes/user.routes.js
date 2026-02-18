const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const userValidator = require('../validators/user.validator');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// Profile routes (any authenticated user)
router.get('/me', userController.updateProfile);
router.put('/me', userController.updateProfile);

// Get users by role
router.get('/role/:role', checkPermission('user_management', 'view'), userController.getUsersByRole);

// Bulk import/export routes
router.post('/bulk-import',
  checkPermission('user_management', 'manage'),
  userController.bulkImportUsers
);

router.get('/export',
  checkPermission('user_management', 'manage'),
  userController.exportUsers
);

// Unified ID generation routes
router.get('/id-generator/next',
  checkPermission('user_management', 'manage'),
  userController.generateNextId
);

router.get('/id-generator/settings',
  checkPermission('user_management', 'manage'),
  userController.getIdSettings
);

router.put('/id-generator/settings',
  checkPermission('user_management', 'manage'),
  userController.updateIdSettings
);

// Legacy student numbering routes (for backward compatibility)
router.get('/student-numbering/next-admission',
  checkPermission('user_management', 'manage'),
  userController.getNextAdmissionNumber
);

router.get('/student-numbering/next-roll',
  checkPermission('user_management', 'manage'),
  userController.getNextRollNumber
);

router.get('/student-numbering/settings',
  checkPermission('user_management', 'manage'),
  userController.getStudentNumberingSettings
);

router.put('/student-numbering/settings',
  checkPermission('user_management', 'manage'),
  userController.updateStudentNumberingSettings
);

// Admin routes - super_admin, admin, and institution_admin can manage users
router.route('/')
  .get(checkPermission('user_management', 'view'), validate(userValidator.getUsers), userController.getUsers)
  .post(
    checkPermission('user_management', 'create'),
    validate(userValidator.createUser),
    userController.createUser
  );

// Get comprehensive user details (all transactions, fees, exams, etc.)
router.get('/:id/details', checkPermission('user_management', 'view'), userController.getUserFullDetails);

router.route('/:id')
  .get(checkPermission('user_management', 'view'), userController.getUserById)
  .put(
    checkPermission('user_management', 'edit'),
    validate(userValidator.updateUser),
    userController.updateUser
  )
  .delete(
    checkPermission('user_management', 'delete'),
    userController.deleteUser
  );

module.exports = router;
