const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  periodNumber: {
    type: Number,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  room: {
    type: String,
    trim: true
  },
  isBreak: {
    type: Boolean,
    default: false
  },
  breakType: {
    type: String,
    enum: ['short', 'lunch', 'assembly', 'other'],
    default: 'short'
  }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  periods: [periodSchema]
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  academicYear: {
    type: String,
    required: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date
  },
  schedule: [dayScheduleSchema],
  periodsPerDay: {
    type: Number,
    default: 8
  },
  periodDuration: {
    type: Number,
    default: 45
  },
  dayStartTime: {
    type: String,
    default: '08:00'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

timetableSchema.index({ institution: 1, class: 1, section: 1, academicYear: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
