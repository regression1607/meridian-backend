const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Institution = require('../models/Institution');
const ApiError = require('../utils/apiError');
const config = require('../config');
const { generateCode } = require('../utils/helpers');

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

    return { message: 'Password changed successfully' };
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
