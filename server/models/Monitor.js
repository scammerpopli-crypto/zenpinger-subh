const mongoose = require('mongoose');

const pingHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['up', 'down', 'degraded'],
    required: true
  },
  responseTime: Number,
  statusCode: Number,
  error: String
});

const monitorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['http', 'https', 'ping', 'port', 'keyword'],
    default: 'https'
  },
  interval: {
    type: Number,
    default: 1
  },
  alertThreshold: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastChecked: Date,
  currentStatus: {
    type: String,
    enum: ['up', 'down', 'degraded', 'unknown'],
    default: 'unknown'
  },
  uptime: {
    type: Number,
    default: 0
  },
  averageResponse: {
    type: Number,
    default: 0
  },
  totalChecks: {
    type: Number,
    default: 0
  },
  successfulChecks: {
    type: Number,
    default: 0
  },
  pingHistory: [pingHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
monitorSchema.index({ userId: 1, isActive: 1 });
monitorSchema.index({ lastChecked: 1 });

module.exports = mongoose.model('Monitor', monitorSchema);
