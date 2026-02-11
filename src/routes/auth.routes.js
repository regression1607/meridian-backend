const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authValidator = require('../validators/auth.validator');
const { protect } = require('../middleware/authMiddleware');
const { uploaders } = require('../middleware/upload.middleware');

// Public routes
router.post('/register', validate(authValidator.register), authController.register);
router.post('/login', validate(authValidator.login), authController.login);
router.post('/refresh', validate(authValidator.refreshToken), authController.refreshToken);
router.post('/forgot-password', validate(authValidator.forgotPassword), authController.forgotPassword);
router.post('/verify-otp', validate(authValidator.verifyOTP), authController.verifyOTP);
router.post('/reset-password', validate(authValidator.resetPassword), authController.resetPassword);

// Protected routes
router.use(protect);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.post('/change-password', validate(authValidator.changePassword), authController.changePassword);

// 2FA routes
router.post('/2fa/enable', authController.enable2FA);
router.post('/2fa/disable', authController.disable2FA);

// Password change with OTP (2FA required)
router.post('/password-change/send-otp', authController.sendPasswordChangeOTP);
router.post('/password-change/verify-otp', authController.verifyPasswordChangeOTP);
router.post('/password-change/with-2fa', authController.changePasswordWith2FA);

// Profile routes
router.put('/profile', authController.updateProfile);
router.post('/profile/avatar', uploaders.profileAvatar, authController.uploadAvatar);
router.post('/profile/cover', uploaders.profileCover, authController.uploadCoverPhoto);

module.exports = router;
