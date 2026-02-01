const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

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
  // TODO: Implement forgot password with email
  res.json(
    ApiResponse.success('If an account exists with this email, a reset link has been sent')
  );
});

exports.resetPassword = asyncHandler(async (req, res) => {
  // TODO: Implement reset password
  res.json(
    ApiResponse.success('Password reset successful')
  );
});
