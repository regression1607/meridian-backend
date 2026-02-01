const mongoose = require('mongoose');

// Salary Structure Schema - defines pay grades and components
const SalaryStructureSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  applicableRoles: [{
    type: String,
    enum: ['teacher', 'staff', 'coordinator', 'institution_admin']
  }],
  components: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    special: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  grossSalary: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

SalaryStructureSchema.index({ institutionId: 1, code: 1 }, { unique: true });

SalaryStructureSchema.pre('save', function(next) {
  const comp = this.components;
  const ded = this.deductions;
  this.grossSalary = (comp.basic || 0) + (comp.hra || 0) + (comp.da || 0) + 
                     (comp.ta || 0) + (comp.medical || 0) + (comp.special || 0) + (comp.other || 0);
  const totalDeductions = (ded.pf || 0) + (ded.esi || 0) + (ded.tax || 0) + (ded.other || 0);
  this.netSalary = this.grossSalary - totalDeductions;
  next();
});

// Employee Salary Schema - assigns salary structure to employee
const EmployeeSalarySchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  salaryStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryStructure'
  },
  // Override components if different from structure
  components: {
    basic: Number,
    hra: Number,
    da: Number,
    ta: Number,
    medical: Number,
    special: Number,
    other: Number
  },
  deductions: {
    pf: Number,
    esi: Number,
    tax: Number,
    other: Number
  },
  grossSalary: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountHolderName: String
  },
  panNumber: String,
  pfNumber: String,
  esiNumber: String,
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_hold'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

EmployeeSalarySchema.index({ institutionId: 1, employee: 1 }, { unique: true });

// Payslip Schema
const PayslipSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeSalary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeSalary'
  },
  payslipNumber: {
    type: String,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  payPeriod: {
    startDate: Date,
    endDate: Date
  },
  workingDays: {
    total: { type: Number, default: 0 },
    present: { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
    holidays: { type: Number, default: 0 },
    lop: { type: Number, default: 0 } // Loss of Pay days
  },
  earnings: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    special: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    arrears: { type: Number, default: 0 }
  },
  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    lop: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  grossEarnings: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'cash'],
      default: 'bank_transfer'
    },
    transactionId: String,
    chequeNumber: String,
    paidOn: Date
  },
  status: {
    type: String,
    enum: ['draft', 'generated', 'approved', 'paid', 'cancelled'],
    default: 'draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  remarks: String,
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

PayslipSchema.index({ institutionId: 1, employee: 1, month: 1, year: 1 }, { unique: true });
PayslipSchema.index({ institutionId: 1, payslipNumber: 1 }, { unique: true });

PayslipSchema.pre('save', function(next) {
  const e = this.earnings;
  const d = this.deductions;
  this.grossEarnings = (e.basic || 0) + (e.hra || 0) + (e.da || 0) + (e.ta || 0) + 
                       (e.medical || 0) + (e.special || 0) + (e.other || 0) + 
                       (e.bonus || 0) + (e.overtime || 0) + (e.arrears || 0);
  this.totalDeductions = (d.pf || 0) + (d.esi || 0) + (d.tax || 0) + (d.lop || 0) + 
                         (d.advance || 0) + (d.loan || 0) + (d.other || 0);
  this.netSalary = this.grossEarnings - this.totalDeductions;
  next();
});

// Bonus Schema
const BonusSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['performance', 'festival', 'annual', 'special', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: String,
  month: Number,
  year: Number,
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  paidOn: Date,
  remarks: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

BonusSchema.index({ institutionId: 1, employee: 1, month: 1, year: 1, type: 1 });

// Advance/Loan Schema
const AdvanceSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['advance', 'loan'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: String,
  requestDate: {
    type: Date,
    default: Date.now
  },
  emiAmount: {
    type: Number,
    default: 0
  },
  totalInstallments: {
    type: Number,
    default: 1
  },
  paidInstallments: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'disbursed', 'repaying', 'completed', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  disbursedOn: Date,
  remarks: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

AdvanceSchema.index({ institutionId: 1, employee: 1 });

AdvanceSchema.pre('save', function(next) {
  if (this.isNew) {
    this.remainingAmount = this.amount;
  }
  next();
});

// Attendance Summary for Payroll (monthly)
const PayrollAttendanceSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  totalDays: { type: Number, default: 0 },
  workingDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  lateDays: { type: Number, default: 0 },
  leaves: {
    casual: { type: Number, default: 0 },
    sick: { type: Number, default: 0 },
    earned: { type: Number, default: 0 },
    unpaid: { type: Number, default: 0 }
  },
  holidays: { type: Number, default: 0 },
  overtime: {
    hours: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  lopDays: { type: Number, default: 0 }
}, { timestamps: true });

PayrollAttendanceSchema.index({ institutionId: 1, employee: 1, month: 1, year: 1 }, { unique: true });

const SalaryStructure = mongoose.model('SalaryStructure', SalaryStructureSchema);
const EmployeeSalary = mongoose.model('EmployeeSalary', EmployeeSalarySchema);
const Payslip = mongoose.model('Payslip', PayslipSchema);
const Bonus = mongoose.model('Bonus', BonusSchema);
const Advance = mongoose.model('Advance', AdvanceSchema);
const PayrollAttendance = mongoose.model('PayrollAttendance', PayrollAttendanceSchema);

module.exports = {
  SalaryStructure,
  EmployeeSalary,
  Payslip,
  Bonus,
  Advance,
  PayrollAttendance
};
