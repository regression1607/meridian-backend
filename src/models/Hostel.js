const mongoose = require('mongoose');

// Hostel Block Schema
const hostelBlockSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['boys', 'girls', 'staff', 'mixed'],
    required: true
  },
  totalFloors: {
    type: Number,
    default: 1
  },
  warden: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contactNumber: String,
  address: String,
  amenities: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

hostelBlockSchema.index({ institution: 1, code: 1 }, { unique: true });

// Room Schema
const roomSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  block: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelBlock',
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    default: 0
  },
  roomType: {
    type: String,
    enum: ['single', 'double', 'triple', 'dormitory'],
    default: 'double'
  },
  capacity: {
    type: Number,
    required: true,
    default: 2
  },
  occupiedBeds: {
    type: Number,
    default: 0
  },
  monthlyRent: {
    type: Number,
    default: 0
  },
  amenities: [String],
  status: {
    type: String,
    enum: ['available', 'full', 'maintenance', 'reserved'],
    default: 'available'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

roomSchema.index({ institution: 1, block: 1, roomNumber: 1 }, { unique: true });

// Room Allocation Schema
const roomAllocationSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bedNumber: {
    type: Number,
    required: true
  },
  allocationDate: {
    type: Date,
    default: Date.now
  },
  vacatingDate: Date,
  academicYear: {
    type: String,
    required: true
  },
  monthlyRent: {
    type: Number,
    default: 0
  },
  securityDeposit: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'vacated', 'transferred'],
    default: 'active'
  },
  allocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

roomAllocationSchema.index({ institution: 1, room: 1, student: 1 });

// Mess Menu Schema
const messMenuSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  block: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelBlock'
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'snacks', 'dinner'],
    required: true
  },
  items: [{
    name: String,
    description: String,
    isVeg: { type: Boolean, default: true }
  }],
  timing: {
    start: String,
    end: String
  },
  specialNote: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

messMenuSchema.index({ institution: 1, dayOfWeek: 1, mealType: 1 });

// Visitor Log Schema
const visitorLogSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  block: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelBlock',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visitorName: {
    type: String,
    required: true
  },
  visitorRelation: {
    type: String,
    required: true
  },
  visitorPhone: String,
  visitorIdType: {
    type: String,
    enum: ['aadhar', 'pan', 'driving_license', 'passport', 'voter_id', 'other']
  },
  visitorIdNumber: String,
  purpose: String,
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['checked_in', 'checked_out', 'rejected'],
    default: 'checked_in'
  },
  remarks: String
}, { timestamps: true });

visitorLogSchema.index({ institution: 1, student: 1, checkInTime: -1 });

// Complaint Schema
const hostelComplaintSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  block: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelBlock'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  complainant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  complaintNumber: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    enum: ['maintenance', 'cleanliness', 'food', 'security', 'roommate', 'facilities', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'rejected'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [String],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

hostelComplaintSchema.index({ institution: 1, status: 1 });

// Pre-save hook to generate complaint number
hostelComplaintSchema.pre('save', async function(next) {
  if (!this.complaintNumber) {
    const count = await this.constructor.countDocuments({ institution: this.institution });
    this.complaintNumber = `HC-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const HostelBlock = mongoose.model('HostelBlock', hostelBlockSchema);
const Room = mongoose.model('Room', roomSchema);
const RoomAllocation = mongoose.model('RoomAllocation', roomAllocationSchema);
const MessMenu = mongoose.model('MessMenu', messMenuSchema);
const VisitorLog = mongoose.model('VisitorLog', visitorLogSchema);
const HostelComplaint = mongoose.model('HostelComplaint', hostelComplaintSchema);

module.exports = {
  HostelBlock,
  Room,
  RoomAllocation,
  MessMenu,
  VisitorLog,
  HostelComplaint
};
