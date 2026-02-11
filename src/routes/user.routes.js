const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const userValidator = require('../validators/user.validator');
const { protect, authorize, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// Profile routes (any authenticated user)
router.get('/me', userController.updateProfile);
router.put('/me', userController.updateProfile);

// Get users by role
router.get('/role/:role', authorizeMinRole('teacher'), userController.getUsersByRole);

// Bulk import/export routes
router.post('/bulk-import',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.bulkImportUsers
);

router.get('/export',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.exportUsers
);

// Unified ID generation routes
router.get('/id-generator/next',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.generateNextId
);

router.get('/id-generator/settings',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.getIdSettings
);

router.put('/id-generator/settings',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.updateIdSettings
);

// Legacy student numbering routes (for backward compatibility)
router.get('/student-numbering/next-admission',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.getNextAdmissionNumber
);

router.get('/student-numbering/next-roll',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.getNextRollNumber
);

router.get('/student-numbering/settings',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.getStudentNumberingSettings
);

router.put('/student-numbering/settings',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
  userController.updateStudentNumberingSettings
);

// Admin routes - super_admin, admin, and institution_admin can manage users
router.route('/')
  .get(authorizeMinRole('teacher'), validate(userValidator.getUsers), userController.getUsers)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
    validate(userValidator.createUser),
    userController.createUser
  );

// Get comprehensive user details (all transactions, fees, exams, etc.)
router.get('/:id/details', authorizeMinRole('teacher'), userController.getUserFullDetails);

router.route('/:id')
  .get(authorizeMinRole('teacher'), userController.getUserById)
  .put(
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
    validate(userValidator.updateUser),
    userController.updateUser
  )
  .delete(
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
    userController.deleteUser
  );

module.exports = router;
