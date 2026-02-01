const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['core', 'elective', 'language', 'practical', 'other'],
    default: 'core'
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  credits: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

subjectSchema.index({ institution: 1, code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Subject', subjectSchema);
