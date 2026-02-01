const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  status: {
    type: String,
    enum: ['submitted', 'late', 'graded', 'returned'],
    default: 'submitted'
  },
  grade: {
    score: Number,
    maxScore: Number,
    percentage: Number
  },
  feedback: {
    type: String
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  }
}, { _id: true });

const homeworkSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
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
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  maxScore: {
    type: Number,
    default: 100
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'published'
  },
  submissions: [submissionSchema],
  allowLateSubmission: {
    type: Boolean,
    default: true
  },
  latePenaltyPercent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
homeworkSchema.index({ institution: 1, class: 1, section: 1 });
homeworkSchema.index({ institution: 1, subject: 1 });
homeworkSchema.index({ institution: 1, assignedBy: 1 });
homeworkSchema.index({ dueDate: 1 });
homeworkSchema.index({ 'submissions.student': 1 });

// Virtual for submission count
homeworkSchema.virtual('submissionCount').get(function() {
  return this.submissions?.length || 0;
});

// Virtual for checking if homework is overdue
homeworkSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

homeworkSchema.set('toJSON', { virtuals: true });
homeworkSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Homework', homeworkSchema);
