const Joi = require('joi');

const register = {
  body: Joi.object().keys({
    firstName: Joi.string().required().trim().min(2).max(50),
    lastName: Joi.string().required().trim().min(2).max(50),
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().required().min(8).max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .message('Password must contain at least one uppercase, one lowercase, one number and one special character'),
    role: Joi.string().valid('institution_admin').default('institution_admin'),
    institution: Joi.object().keys({
      name: Joi.string().required().trim().min(2).max(200),
      type: Joi.string().valid('primary', 'secondary', 'higher_secondary', 'college', 'university', 'coaching').required(),
      email: Joi.string().email().lowercase().trim(),
      phone: Joi.string().pattern(/^[+]?[\d\s-]{10,15}$/),
    }).required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().required(),
  }),
};

const refreshToken = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().required().email().lowercase().trim(),
  }),
};

const verifyOTP = {
  body: Joi.object().keys({
    email: Joi.string().required().email().lowercase().trim(),
    otp: Joi.string().required().length(6).pattern(/^\d{6}$/)
      .message('OTP must be a 6-digit number'),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    email: Joi.string().required().email().lowercase().trim(),
    resetToken: Joi.string().required(),
    newPassword: Joi.string().required().min(8).max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .message('Password must contain at least one uppercase, one lowercase, one number and one special character'),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(8).max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .message('Password must contain at least one uppercase, one lowercase, one number and one special character'),
  }),
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
};
