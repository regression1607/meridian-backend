const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequenceValue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

/**
 * Get next sequence value atomically
 * @param {string} sequenceName - Unique identifier for the sequence
 * @param {number} minValue - Minimum value to start from (to handle existing data)
 * @returns {Promise<number>} - Next sequence number
 */
counterSchema.statics.getNextSequence = async function(sequenceName, minValue = 0) {
  // Use $max to ensure we never go below minValue
  // This atomically increments OR sets to minValue+1 if current value is less
  const counter = await this.findOneAndUpdate(
    { _id: sequenceName },
    [
      {
        $set: {
          sequenceValue: {
            $add: [
              { $max: [{ $ifNull: ['$sequenceValue', 0] }, minValue] },
              1
            ]
          }
        }
      }
    ],
    { 
      new: true, 
      upsert: true
    }
  );
  return counter.sequenceValue;
};

/**
 * Generate application number atomically
 * @param {string} institutionId - Institution ID
 * @param {string} academicYear - Academic year (e.g., '2026-27')
 * @returns {Promise<string>} - Application number (e.g., 'APP-2026-0001')
 */
counterSchema.statics.generateApplicationNumber = async function(institutionId, academicYear) {
  const year = new Date().getFullYear();
  const sequenceName = `APP-${year}-${institutionId}`;
  
  // Find the current max application number in the database for this year
  const AdmissionApplication = mongoose.model('AdmissionApplication');
  const pattern = new RegExp(`^APP-${year}-(\\d+)$`);
  
  const maxApp = await AdmissionApplication.findOne({
    applicationNumber: { $regex: pattern }
  }).sort({ applicationNumber: -1 }).select('applicationNumber').lean();
  
  let currentMax = 0;
  if (maxApp && maxApp.applicationNumber) {
    const match = maxApp.applicationNumber.match(pattern);
    if (match) {
      currentMax = parseInt(match[1], 10);
    }
  }
  
  const sequenceNumber = await this.getNextSequence(sequenceName, currentMax);
  return `APP-${year}-${String(sequenceNumber).padStart(4, '0')}`;
};

/**
 * Generate admission number atomically
 * @param {string} institutionId - Institution ID
 * @returns {Promise<string>} - Admission number (e.g., 'ADM-2026-0001')
 */
counterSchema.statics.generateAdmissionNumber = async function(institutionId) {
  const year = new Date().getFullYear();
  const sequenceName = `ADM-${year}-${institutionId}`;
  
  // Find the current max admission number in the database for this year
  const Enrollment = mongoose.model('Enrollment');
  const pattern = new RegExp(`^ADM-${year}-(\\d+)$`);
  
  const maxEnroll = await Enrollment.findOne({
    admissionNumber: { $regex: pattern }
  }).sort({ admissionNumber: -1 }).select('admissionNumber').lean();
  
  let currentMax = 0;
  if (maxEnroll && maxEnroll.admissionNumber) {
    const match = maxEnroll.admissionNumber.match(pattern);
    if (match) {
      currentMax = parseInt(match[1], 10);
    }
  }
  
  const sequenceNumber = await this.getNextSequence(sequenceName, currentMax);
  return `ADM-${year}-${String(sequenceNumber).padStart(4, '0')}`;
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
