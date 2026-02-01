const mongoose = require('mongoose');

const WidgetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  size: { type: String, enum: ['small', 'medium', 'large', 'full'], default: 'medium' },
  position: { type: Number, required: true },
  visible: { type: Boolean, default: true },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const UserPreferencesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  dashboard: {
    widgets: [WidgetSchema],
    layout: {
      type: String,
      enum: ['grid', 'list'],
      default: 'grid'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    }
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  language: { type: String, default: 'en' },
  timezone: { type: String, default: 'Asia/Kolkata' }
}, { timestamps: true });

UserPreferencesSchema.index({ user: 1 });

module.exports = mongoose.model('UserPreferences', UserPreferencesSchema);
