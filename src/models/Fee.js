const mongoose = require('mongoose');
const { FEE_STATUS } = require('../config/constants');

// Fee Structure - defines fee types and amounts
const feeStructureSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['tuition', 'admission', 'exam', 'transport', 'hostel', 'library', 'sports', 'lab', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly'],
    default: 'monthly'
  },
  applicableTo: {
    type: String,
    enum: ['all', 'class', 'section', 'individual'],
    default: 'all'
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  dueDay: {
    type: Number,
    min: 1,
    max: 28,
    default: 10
  },
  lateFee: {
    type: Number,
    default: 0
  },
  lateFeeAfterDays: {
    type: Number,
    default: 15
  },
  academicYear: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Fee Payment - tracks individual payments
const feePaymentSchema = new mongoose.Schema({
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
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  status: {
    type: String,
    enum: Object.values(FEE_STATUS),
    default: FEE_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'cheque', 'online', 'bank_transfer', 'upi', 'card'],
  },
  transactionId: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  lateFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  discountReason: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  duesBreakdown: {
    feeAmount: { type: Number, default: 0 },
    transport: {
      included: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      description: { type: String }
    },
    hostel: {
      included: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      description: { type: String }
    },
    libraryFines: [{
      fineId: { type: mongoose.Schema.Types.ObjectId },
      amount: { type: Number },
      description: { type: String }
    }]
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  year: {
    type: Number
  },
  academicYear: {
    type: String
  },
  alertCount: {
    type: Number,
    default: 0
  },
  lastAlertSentAt: {
    type: Date
  },
  alertHistory: [{
    sentAt: { type: Date, default: Date.now },
    sentTo: { type: String },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true
});

feeStructureSchema.index({ institution: 1, type: 1, academicYear: 1 });
feePaymentSchema.index({ institution: 1, student: 1, status: 1 });
feePaymentSchema.index({ institution: 1, dueDate: 1, status: 1 });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

module.exports = { FeeStructure, FeePayment };
