const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Institution = require('../models/Institution');
const ApiError = require('../utils/apiError');
const config = require('../config');
const { generateCode } = require('../utils/helpers');
const emailService = require('../utils/emailService');

class AuthService {
  generateTokens(user) {
    const accessToken = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        institution: user.institution 
      },
      config.jwt.secret,
      { expiresIn: `${config.jwt.accessExpirationMinutes}m` }
    );

    const refreshToken = jwt.sign(
      { id: user._id, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: `${config.jwt.refreshExpirationDays}d` }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.accessExpirationMinutes * 60
    };
  }

  async register(userData) {
    const { institution: institutionData, firstName, lastName, ...userInfo } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: userInfo.email });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    // Create institution first
    const institutionCode = generateCode(institutionData.name);
    const institution = await Institution.create({
      ...institutionData,
      code: institutionCode,
      subscription: {
        plan: 'trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Create user with institution reference
    const user = await User.create({
      ...userInfo,
      institution: institution._id,
      profile: {
        firstName,
        lastName
      },
      isEmailVerified: false,
      isActive: true
    });

    // Update institution with admin reference
    institution.adminUsers = [user._id];
    await institution.save();

    return {
      user: this.sanitizeUser(user),
      institution: {
        _id: institution._id,
        name: institution.name,
        code: institution.code
      }
    };
  }

  async login(email, password) {
    const user = await User.findOne({ email })
      .select('+password')
      .populate('institution', 'name code type');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is inactive. Please contact administrator.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const tokens = this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user)
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      
      if (decoded.type !== 'refresh') {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      const user = await User.findById(decoded.id)
        .populate('institution', 'name code type');

      if (!user || user.isDeleted) {
        throw ApiError.unauthorized('User not found');
      }

      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Invalid or expired refresh token');
      }
      throw error;
    }
  }

  async getMe(userId) {
    const user = await User.findById(userId)
      .populate('institution', 'name code type status config branding');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return this.sanitizeUser(user);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Send password changed notification
    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
    emailService.sendPasswordChanged({
      to: user.email,
      name: userName
    }).catch(err => console.error('Failed to send password change email:', err));

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If this email exists, you will receive a password reset link' };
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP and store
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    
    user.passwordResetToken = hashedOtp;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP email
    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
    await emailService.sendOTP({
      to: user.email,
      otp: otp,
      name: userName,
      expiresIn: '10 minutes'
    });

    return { message: 'OTP sent to your email address' };
  }

  async verifyOTP(email, otp) {
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      passwordResetToken: hashedOtp,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    // Generate a temporary reset token for the next step
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes for password reset
    await user.save();

    return { 
      message: 'OTP verified successfully',
      resetToken: resetToken
    };
  }

  async resetPassword(email, resetToken, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    // Send password changed notification
    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
    emailService.sendPasswordChanged({
      to: user.email,
      name: userName
    }).catch(err => console.error('Failed to send password change email:', err));

    return { message: 'Password reset successfully' };
  }

  async sendPasswordResetLink(email) {
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      return { message: 'If this email exists, you will receive a password reset link' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email
    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
    await emailService.sendPasswordReset({
      to: user.email,
      resetLink: resetUrl,
      name: userName,
      expiresIn: '1 hour'
    });

    return { message: 'Password reset link sent to your email' };
  }

  // 2FA Methods
  async enable2FA(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.twoFactorEnabled = true;
    await user.save();

    return { message: 'Two-Factor Authentication enabled successfully' };
  }

  async disable2FA(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.twoFactorEnabled = false;
    await user.save();

    return { message: 'Two-Factor Authentication disabled' };
  }

  // Password Change with OTP Methods
  async sendPasswordChangeOTP(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw ApiError.badRequest('Please enable Two-Factor Authentication first');
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP and store
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    
    user.passwordChangeOTP = hashedOtp;
    user.passwordChangeOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP email
    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
    await emailService.sendOTP({
      to: user.email,
      otp: otp,
      name: userName,
      expiresIn: '10 minutes'
    });

    return { message: 'OTP sent to your email address' };
  }

  async verifyPasswordChangeOTP(userId, otp) {
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      _id: userId,
      passwordChangeOTP: hashedOtp,
      passwordChangeOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    // Generate a temporary token for password change
    const otpToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(otpToken).digest('hex');

    user.passwordChangeToken = hashedToken;
    user.passwordChangeTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    user.passwordChangeOTP = undefined;
    user.passwordChangeOTPExpires = undefined;
    await user.save();

    return { 
      message: 'OTP verified successfully',
      otpToken: otpToken
    };
  }

  async changePasswordWith2FA(userId, newPassword, otpToken) {
    const hashedToken = crypto.createHash('sha256').update(otpToken).digest('hex');

    const user = await User.findOne({
      _id: userId,
      passwordChangeToken: hashedToken,
      passwordChangeTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired token. Please verify OTP again.');
    }

    user.password = newPassword;
    user.passwordChangeToken = undefined;
    user.passwordChangeTokenExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    // Send password changed notification
    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
    emailService.sendPasswordChanged({
      to: user.email,
      name: userName
    }).catch(err => console.error('Failed to send password change email:', err));

    return { message: 'Password changed successfully' };
  }

  // Profile Update Methods
  async updateProfile(userId, profileData) {
    const user = await User.findById(userId).populate('institution', 'name');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const { firstName, lastName, phone, bio, address } = profileData;

    // Update profile fields
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phone !== undefined) user.profile.phone = phone;
    if (bio !== undefined) user.profile.bio = bio;
    if (address) {
      user.profile.address = {
        ...user.profile.address,
        ...address
      };
    }

    await user.save();
    return this.sanitizeUser(user);
  }

  async updateProfileImage(userId, imageType, imageData) {
    const user = await User.findById(userId).populate('institution', 'name');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (imageType === 'avatar') {
      user.profile.avatar = imageData;
    } else if (imageType === 'coverPhoto') {
      user.profile.coverPhoto = imageData;
    } else {
      throw ApiError.badRequest('Invalid image type');
    }

    await user.save();
    return this.sanitizeUser(user);
  }

  sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : user;
    const {
      password,
      __v,
      isDeleted,
      passwordResetToken,
      passwordResetExpires,
      emailVerificationToken,
      ...sanitized
    } = userObj;
    return sanitized;
  }
}

module.exports = new AuthService();
