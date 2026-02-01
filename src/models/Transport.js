const mongoose = require('mongoose');

// Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['bus', 'van', 'mini_bus', 'auto'],
    default: 'bus'
  },
  capacity: {
    type: Number,
    required: true
  },
  driverName: {
    type: String,
    required: true
  },
  driverPhone: {
    type: String,
    required: true
  },
  driverLicense: {
    type: String
  },
  conductorName: String,
  conductorPhone: String,
  insuranceNumber: String,
  insuranceExpiry: Date,
  fitnessExpiry: Date,
  permitExpiry: Date,
  fuelType: {
    type: String,
    enum: ['diesel', 'petrol', 'cng', 'electric'],
    default: 'diesel'
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  gpsEnabled: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Route Schema
const routeSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  routeCode: {
    type: String,
    required: true,
    trim: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  stops: [{
    stopName: {
      type: String,
      required: true
    },
    stopOrder: {
      type: Number,
      required: true
    },
    pickupTime: String,
    dropTime: String,
    landmark: String,
    latitude: Number,
    longitude: Number,
    monthlyFee: {
      type: Number,
      default: 0
    }
  }],
  distance: {
    type: Number,
    default: 0
  },
  estimatedTime: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Transport Allocation Schema (Student to Route mapping)
const transportAllocationSchema = new mongoose.Schema({
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
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  stop: {
    type: String,
    required: true
  },
  pickupType: {
    type: String,
    enum: ['pickup', 'drop', 'both'],
    default: 'both'
  },
  monthlyFee: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  academicYear: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes
vehicleSchema.index({ institution: 1, vehicleNumber: 1 }, { unique: true });
routeSchema.index({ institution: 1, routeCode: 1 }, { unique: true });
transportAllocationSchema.index({ institution: 1, student: 1, academicYear: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Route = mongoose.model('Route', routeSchema);
const TransportAllocation = mongoose.model('TransportAllocation', transportAllocationSchema);

module.exports = { Vehicle, Route, TransportAllocation };
