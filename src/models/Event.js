const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['academic', 'cultural', 'sports', 'holiday', 'exam', 'meeting', 'workshop', 'seminar', 'other'],
    default: 'other'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startTime: String,
  endTime: String,
  isAllDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  venue: {
    name: String,
    address: String,
    capacity: Number
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetAudience: [{
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'staff', 'admin']
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: Number,
    endDate: Date,
    daysOfWeek: [Number]
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  registrationRequired: {
    type: Boolean,
    default: false
  },
  registrationDeadline: Date,
  maxParticipants: Number,
  registeredParticipants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    }
  }],
  color: {
    type: String,
    default: '#3B82F6'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification', 'sms']
    },
    beforeMinutes: Number,
    sent: {
      type: Boolean,
      default: false
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

EventSchema.index({ institutionId: 1, startDate: 1 });
EventSchema.index({ institutionId: 1, type: 1 });
EventSchema.index({ institutionId: 1, status: 1 });

module.exports = mongoose.model('Event', EventSchema);
