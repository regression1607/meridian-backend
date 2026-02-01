const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true
  },
  examType: {
    type: String,
    enum: ['unit_test', 'mid_term', 'final', 'quarterly', 'half_yearly', 'annual', 'practical', 'assignment'],
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
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  examDate: {
    type: Date,
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
  duration: {
    type: Number, // in minutes
    required: true
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 100
  },
  passingMarks: {
    type: Number,
    required: true,
    default: 35
  },
  room: {
    type: String,
    trim: true
  },
  invigilator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  instructions: {
    type: String
  },
  syllabus: {
    type: String
  },
  academicYear: {
    type: String,
    default: function() {
      const now = new Date();
      const year = now.getFullYear();
      return now.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }
  },
  term: {
    type: String,
    enum: ['term1', 'term2', 'term3'],
    default: 'term1'
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

examSchema.index({ institution: 1, class: 1, subject: 1, examDate: 1 });
examSchema.index({ institution: 1, examType: 1, academicYear: 1 });

module.exports = mongoose.model('Exam', examSchema);
