const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const AIChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [MessageSchema],
  context: {
    type: String,
    enum: ['general', 'students', 'attendance', 'fees', 'academics', 'reports', 'help'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

AIChatSchema.index({ user: 1, createdAt: -1 });
AIChatSchema.index({ institutionId: 1 });

module.exports = mongoose.model('AIChat', AIChatSchema);
