const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionNumber: Number,
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['mcq', 'short_answer', 'long_answer', 'fill_blank', 'true_false', 'match'],
    required: true
  },
  marks: { type: Number, required: true },
  options: [String], // For MCQ
  correctAnswer: String,
  hint: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
});

const sectionSchema = new mongoose.Schema({
  sectionName: { type: String, default: 'Section A' },
  instructions: String,
  questions: [questionSchema]
});

const questionPaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  subjectName: String,
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  className: String,
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examType: {
    type: String,
    enum: ['unit_test', 'mid_term', 'final', 'practice', 'quiz', 'assignment'],
    default: 'practice'
  },
  duration: { type: Number, default: 60 }, // in minutes
  totalMarks: { type: Number, required: true },
  passingMarks: Number,
  instructions: [String],
  sections: [sectionSchema],
  rawContent: String, // For rich text editor content
  topic: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed'
  },
  referenceDocument: {
    fileName: String,
    extractedText: String
  },
  generationConfig: {
    questionTypes: [{
      type: { type: String },
      count: Number,
      marksEach: Number
    }],
    totalQuestions: Number,
    aiModel: String,
    prompt: String
  },
  status: {
    type: String,
    enum: ['draft', 'finalized', 'published'],
    default: 'draft'
  },
  academicYear: String,
  term: String
}, {
  timestamps: true
});

questionPaperSchema.index({ institution: 1, subject: 1, createdAt: -1 });
questionPaperSchema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);
