const mongoose = require('mongoose');

const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  DOCUMENT_PENDING: 'document_pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ENROLLED: 'enrolled',
  WITHDRAWN: 'withdrawn'
};

const DOCUMENT_TYPES = {
  BIRTH_CERTIFICATE: 'birth_certificate',
  PREVIOUS_MARKSHEET: 'previous_marksheet',
  TRANSFER_CERTIFICATE: 'transfer_certificate',
  PHOTO: 'photo',
  ADDRESS_PROOF: 'address_proof',
  AADHAR: 'aadhar',
  OTHER: 'other'
};

const admissionApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    unique: true,
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  applyingForClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  preferredSection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  
  // Student Information
  studentInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    bloodGroup: { type: String },
    nationality: { type: String, default: 'Indian' },
    religion: { type: String },
    category: { type: String, enum: ['general', 'obc', 'sc', 'st', 'ews', 'other'] },
    motherTongue: { type: String },
    photo: { type: String },
    email: { type: String, trim: true, lowercase: true } // Email for student account creation
  },

  // Parent/Guardian Information
  fatherInfo: {
    name: { type: String },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String },
    occupation: { type: String },
    qualification: { type: String },
    annualIncome: { type: Number },
    isDeceased: { type: Boolean, default: false }
  },
  motherInfo: {
    name: { type: String },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String },
    occupation: { type: String },
    qualification: { type: String },
    isDeceased: { type: Boolean, default: false }
  },
  guardianInfo: {
    name: { type: String },
    relation: { type: String },
    phone: { type: String },
    email: { type: String, trim: true, lowercase: true },
    isRequired: { type: Boolean, default: false } // True when both parents deceased
  },
  // Primary contact for parent account creation
  primaryContact: {
    type: String,
    enum: ['father', 'mother', 'guardian'],
    default: 'father'
  },

  // Address
  address: {
    street: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    zipCode: { type: String, default: '' }
  },

  // Previous School Information
  previousSchool: {
    name: { type: String },
    board: { type: String },
    class: { type: String },
    percentage: { type: Number },
    yearOfPassing: { type: Number },
    reasonForLeaving: { type: String }
  },

  // Documents
  documents: [{
    type: { type: String, enum: Object.values(DOCUMENT_TYPES) },
    name: { type: String },
    url: { type: String },
    verified: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Application Status
  status: {
    type: String,
    enum: Object.values(APPLICATION_STATUS),
    default: APPLICATION_STATUS.SUBMITTED
  },
  statusHistory: [{
    status: { type: String, enum: Object.values(APPLICATION_STATUS) },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    remarks: { type: String }
  }],

  // Review Information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: { type: Date },
  reviewRemarks: { type: String },
  
  // Interview/Test
  entranceTest: {
    scheduled: { type: Boolean, default: false },
    date: { type: Date },
    score: { type: Number },
    maxScore: { type: Number },
    remarks: { type: String }
  },
  interview: {
    scheduled: { type: Boolean, default: false },
    date: { type: Date },
    conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    rating: { type: Number, min: 1, max: 5 }
  },

  // Fee Information
  applicationFee: {
    amount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    transactionId: { type: String },
    paidAt: { type: Date }
  },

  // Priority/Source
  priority: { type: Number, default: 0 },
  source: { type: String, enum: ['online', 'offline', 'referral', 'transfer'], default: 'online' },
  referredBy: { type: String },

  // Timestamps
  submittedAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes
admissionApplicationSchema.index({ institution: 1, applicationNumber: 1 });
admissionApplicationSchema.index({ institution: 1, status: 1 });
admissionApplicationSchema.index({ institution: 1, academicYear: 1 });
admissionApplicationSchema.index({ 'studentInfo.firstName': 'text', 'studentInfo.lastName': 'text', 'fatherInfo.name': 'text' });

// NOTE: Application number is now generated atomically in admission.service.js using Counter model
// This prevents race conditions that cause duplicate key errors

// Enrollment Schema - Created when application is approved and student is enrolled
const enrollmentSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdmissionApplication',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  admissionNumber: {
    type: String,
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
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
  rollNumber: { type: String },
  
  // Fee Status
  admissionFeePaid: { type: Boolean, default: false },
  admissionFeeAmount: { type: Number },
  admissionFeeTransactionId: { type: String },
  
  // Enrollment Details
  enrolledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: { type: String },
  
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes
enrollmentSchema.index({ institution: 1, admissionNumber: 1 }, { unique: true });
enrollmentSchema.index({ institution: 1, student: 1 });
enrollmentSchema.index({ application: 1 }, { unique: true });

// NOTE: Admission number is now generated atomically in admission.service.js using Counter model
// This prevents race conditions that cause duplicate key errors

const AdmissionApplication = mongoose.model('AdmissionApplication', admissionApplicationSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = {
  AdmissionApplication,
  Enrollment,
  APPLICATION_STATUS,
  DOCUMENT_TYPES
};
