const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'contract'],
    default: 'full-time'
  },
  status: {
    type: String,
    enum: ['wishlist', 'applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn'],
    default: 'wishlist'
  },
  appliedDate: {
    type: Date
  },
  deadline: {
    type: Date
  },
  salary: {
    type: String
  },
  location: {
    type: String
  },
  remoteType: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    default: 'onsite'
  },
  jobUrl: {
    type: String
  },
  description: {
    type: String
  },
  notes: {
    type: String
  },
  contactName: {
    type: String
  },
  contactEmail: {
    type: String
  },
  contactPhone: {
    type: String
  },
  interviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

ApplicationSchema.index({ user: 1, status: 1 });
ApplicationSchema.index({ user: 1, appliedDate: -1 });

module.exports = mongoose.model('Application', ApplicationSchema);
