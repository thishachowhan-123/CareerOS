const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in-progress', 'review', 'done'],
    default: 'backlog'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['general', 'application', 'interview', 'skill', 'network', 'resume'],
    default: 'general'
  },
  dueDate: {
    type: Date
  },
  estimatedHours: {
    type: Number
  },
  tags: [{
    type: String,
    trim: true
  }],
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }
}, {
  timestamps: true
});

TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, priority: 1 });

module.exports = mongoose.model('Task', TaskSchema);
