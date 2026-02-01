const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['student', 'teacher', 'staff'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ATTENDANCE_STATUS),
    default: ATTENDANCE_STATUS.PRESENT
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for unique attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ institution: 1, date: 1, userType: 1 });
attendanceSchema.index({ class: 1, section: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
