const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const uploadService = require('../utils/uploadService');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(
    ApiResponse.created('Registration successful', result)
  );
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(
    ApiResponse.success('Login successful', result)
  );
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  res.json(
    ApiResponse.success('Token refreshed', result)
  );
});

exports.logout = asyncHandler(async (req, res) => {
  // In a production app, you would invalidate the refresh token here
  res.json(
    ApiResponse.success('Logged out successfully')
  );
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.json(
    ApiResponse.success('User profile fetched', user)
  );
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, oldPassword, newPassword);
  res.json(
    ApiResponse.success(result.message)
  );
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  res.json(
    ApiResponse.success(result.message)
  );
});

exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyOTP(email, otp);
  res.json(
    ApiResponse.success(result.message, { resetToken: result.resetToken })
  );
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  const result = await authService.resetPassword(email, resetToken, newPassword);
  res.json(
    ApiResponse.success(result.message)
  );
});

// 2FA Controllers
exports.enable2FA = asyncHandler(async (req, res) => {
  const result = await authService.enable2FA(req.user._id);
  res.json(
    ApiResponse.success(result.message)
  );
});

exports.disable2FA = asyncHandler(async (req, res) => {
  const result = await authService.disable2FA(req.user._id);
  res.json(
    ApiResponse.success(result.message)
  );
});

// Password Change with OTP Controllers
exports.sendPasswordChangeOTP = asyncHandler(async (req, res) => {
  const result = await authService.sendPasswordChangeOTP(req.user._id);
  res.json(
    ApiResponse.success(result.message)
  );
});

exports.verifyPasswordChangeOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const result = await authService.verifyPasswordChangeOTP(req.user._id, otp);
  res.json(
    ApiResponse.success(result.message, { otpToken: result.otpToken })
  );
});

exports.changePasswordWith2FA = asyncHandler(async (req, res) => {
  const { newPassword, otpToken } = req.body;
  const result = await authService.changePasswordWith2FA(req.user._id, newPassword, otpToken);
  res.json(
    ApiResponse.success(result.message)
  );
});

// Profile Update Controllers
exports.updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateProfile(req.user._id, req.body);
  res.json(
    ApiResponse.success('Profile updated successfully', result)
  );
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(ApiResponse.error('No file uploaded'));
  }
  
  const imageData = await uploadService.processProfileImage(req.file, 'avatar', req.user._id);
  const result = await authService.updateProfileImage(req.user._id, 'avatar', imageData.data);
  
  res.json(
    ApiResponse.success('Avatar uploaded successfully', result)
  );
});

exports.uploadCoverPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(ApiResponse.error('No file uploaded'));
  }
  
  const imageData = await uploadService.processProfileImage(req.file, 'cover', req.user._id);
  const result = await authService.updateProfileImage(req.user._id, 'coverPhoto', imageData.data);
  
  res.json(
    ApiResponse.success('Cover photo uploaded successfully', result)
  );
});
