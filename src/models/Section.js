const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  maxStudents: {
    type: Number,
    default: 40
  },
  room: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

sectionSchema.index({ class: 1, name: 1 }, { unique: true });

sectionSchema.virtual('studentCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'studentData.section',
  count: true
});

module.exports = mongoose.model('Section', sectionSchema);
