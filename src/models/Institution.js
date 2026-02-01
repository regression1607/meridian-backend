const mongoose = require('mongoose');
const { INSTITUTION_TYPES } = require('../config/constants');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'Institution code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Code cannot exceed 20 characters']
  },
  type: {
    type: String,
    enum: Object.values(INSTITUTION_TYPES),
    required: [true, 'Institution type is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    zipCode: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  branding: {
    logo: String,
    favicon: String,
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#1E40AF' }
  },
  config: {
    academicYear: {
      startMonth: { type: Number, default: 4 },
      endMonth: { type: Number, default: 3 }
    },
    workingDays: {
      type: [String],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    timings: {
      startTime: { type: String, default: '08:00' },
      endTime: { type: String, default: '14:00' }
    },
    grading: {
      system: { type: String, enum: ['percentage', 'gpa', 'grades', 'cgpa'], default: 'percentage' },
      passingMarks: { type: Number, default: 33 }
    },
    attendance: {
      minimumPercentage: { type: Number, default: 75 }
    },
    fees: {
      currency: { type: String, default: 'INR' },
      lateFeePerDay: { type: Number, default: 0 },
      gracePeriodDays: { type: Number, default: 7 }
    }
  },
  features: {
    parentPortal: { type: Boolean, default: true },
    onlinePayment: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    aiFeatures: { type: Boolean, default: true },
    library: { type: Boolean, default: true },
    transport: { type: Boolean, default: true },
    hostel: { type: Boolean, default: false }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
    startDate: Date,
    endDate: Date,
    maxStudents: { type: Number, default: 100 },
    maxStaff: { type: Number, default: 20 }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
institutionSchema.index({ code: 1 }, { unique: true });
institutionSchema.index({ type: 1, isActive: 1 });
institutionSchema.index({ 'address.city': 1, 'address.state': 1 });

// Virtual for current academic year
institutionSchema.virtual('currentAcademicYear').get(function() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startMonth = this.config?.academicYear?.startMonth || 4;
  
  if (currentMonth >= startMonth) {
    return `${currentYear}-${currentYear + 1}`;
  }
  return `${currentYear - 1}-${currentYear}`;
});

module.exports = mongoose.model('Institution', institutionSchema);
