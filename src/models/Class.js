const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
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
  grade: {
    type: Number,
    min: 1,
    max: 12
  },
  sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  academicYear: {
    type: String,
    default: function() {
      const now = new Date();
      const year = now.getFullYear();
      return now.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }
  },
  maxStudents: {
    type: Number,
    default: 50
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

classSchema.index({ institution: 1, name: 1, academicYear: 1 }, { unique: true });

classSchema.virtual('studentCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'studentData.class',
  count: true
});

module.exports = mongoose.model('Class', classSchema);
