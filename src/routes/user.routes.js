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

// Admin routes - super_admin, admin, and institution_admin can manage users
router.route('/')
  .get(authorizeMinRole('teacher'), validate(userValidator.getUsers), userController.getUsers)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTITUTION_ADMIN),
    validate(userValidator.createUser),
    userController.createUser
  );

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
