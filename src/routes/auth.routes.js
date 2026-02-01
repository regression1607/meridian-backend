const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authValidator = require('../validators/auth.validator');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', validate(authValidator.register), authController.register);
router.post('/login', validate(authValidator.login), authController.login);
router.post('/refresh', validate(authValidator.refreshToken), authController.refreshToken);
router.post('/forgot-password', validate(authValidator.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidator.resetPassword), authController.resetPassword);

// Protected routes
router.use(protect);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.post('/change-password', validate(authValidator.changePassword), authController.changePassword);

module.exports = router;
