const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: function() {
      // Super admin and admin don't need institution
      return this.role !== ROLES.SUPER_ADMIN && this.role !== ROLES.ADMIN;
    }
  },
  profile: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  // Role-specific data
  teacherData: {
    employeeId: String,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    qualification: String,
    experience: Number,
    joiningDate: Date
  },
  studentData: {
    admissionNumber: String,
    rollNumber: String,
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    admissionDate: Date,
    bloodGroup: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  parentData: {
    occupation: String,
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    relation: { type: String, enum: ['father', 'mother', 'guardian'] }
  },
  staffData: {
    employeeId: String,
    department: String,
    designation: String,
    joiningDate: Date
  },
  // Security
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: true },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshToken: String,
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Index for faster queries
userSchema.index({ institution: 1, role: 1 });
userSchema.index({ 'studentData.class': 1, 'studentData.section': 1 });
userSchema.index({ email: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: `${process.env.JWT_ACCESS_EXPIRATION_MINUTES}m` }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: `${process.env.JWT_REFRESH_EXPIRATION_DAYS}d` }
  );
  this.refreshToken = refreshToken;
  return refreshToken;
};

// Check if password changed after token was issued
userSchema.methods.changedPasswordAfter = function(jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
