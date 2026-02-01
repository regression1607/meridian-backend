const mongoose = require('mongoose');

const subjectResultSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  subjectName: String,
  results: [{
    examType: String,
    examName: String,
    marksObtained: Number,
    totalMarks: Number,
    percentage: Number,
    grade: String
  }],
  totalMarksObtained: Number,
  totalMaxMarks: Number,
  averagePercentage: Number,
  finalGrade: String
}, { _id: false });

const reportCardSchema = new mongoose.Schema({
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
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    default: function() {
      const now = new Date();
      const year = now.getFullYear();
      return now.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }
  },
  term: {
    type: String,
    enum: ['term1', 'term2', 'term3', 'annual'],
    required: true
  },
  subjectResults: [subjectResultSchema],
  attendance: {
    totalDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  totalMarksObtained: {
    type: Number,
    default: 0
  },
  totalMaxMarks: {
    type: Number,
    default: 0
  },
  overallPercentage: {
    type: Number,
    default: 0
  },
  overallGrade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E', 'F']
  },
  rank: {
    type: Number
  },
  totalStudents: {
    type: Number
  },
  classTeacherRemarks: {
    type: String
  },
  principalRemarks: {
    type: String
  },
  conductGrade: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement']
  },
  coScholasticActivities: [{
    activity: String,
    grade: String,
    remarks: String
  }],
  status: {
    type: String,
    enum: ['draft', 'generated', 'published', 'archived'],
    default: 'draft'
  },
  promotionStatus: {
    type: String,
    enum: ['promoted', 'detained', 'pending'],
    default: 'pending'
  },
  nextClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: {
    type: Date
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate overall percentage and grade before saving
reportCardSchema.pre('save', function(next) {
  if (this.totalMarksObtained !== undefined && this.totalMaxMarks > 0) {
    this.overallPercentage = Math.round((this.totalMarksObtained / this.totalMaxMarks) * 100 * 100) / 100;
    
    if (this.overallPercentage >= 90) this.overallGrade = 'A+';
    else if (this.overallPercentage >= 80) this.overallGrade = 'A';
    else if (this.overallPercentage >= 70) this.overallGrade = 'B+';
    else if (this.overallPercentage >= 60) this.overallGrade = 'B';
    else if (this.overallPercentage >= 50) this.overallGrade = 'C+';
    else if (this.overallPercentage >= 40) this.overallGrade = 'C';
    else if (this.overallPercentage >= 33) this.overallGrade = 'D';
    else if (this.overallPercentage >= 25) this.overallGrade = 'E';
    else this.overallGrade = 'F';
  }
  
  if (this.attendance.totalDays > 0) {
    this.attendance.percentage = Math.round((this.attendance.presentDays / this.attendance.totalDays) * 100 * 100) / 100;
  }
  
  next();
});

reportCardSchema.index({ student: 1, academicYear: 1, term: 1 }, { unique: true });
reportCardSchema.index({ institution: 1, class: 1, academicYear: 1, term: 1 });

module.exports = mongoose.model('ReportCard', reportCardSchema);
