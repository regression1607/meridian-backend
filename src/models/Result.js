const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E', 'F'],
  },
  remarks: {
    type: String
  },
  status: {
    type: String,
    enum: ['pass', 'fail', 'absent', 'withheld'],
    default: 'pass'
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
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate percentage and grade before saving
resultSchema.pre('save', function(next) {
  if (this.marksObtained !== undefined && this.totalMarks) {
    this.percentage = Math.round((this.marksObtained / this.totalMarks) * 100 * 100) / 100;
    
    // Calculate grade based on percentage
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C+';
    else if (this.percentage >= 40) this.grade = 'C';
    else if (this.percentage >= 33) this.grade = 'D';
    else if (this.percentage >= 25) this.grade = 'E';
    else this.grade = 'F';
  }
  next();
});

resultSchema.index({ exam: 1, student: 1 }, { unique: true });
resultSchema.index({ institution: 1, student: 1, academicYear: 1 });
resultSchema.index({ institution: 1, class: 1, subject: 1 });

module.exports = mongoose.model('Result', resultSchema);
