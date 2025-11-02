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
  statusCode: Number
  // Removed error field to save space
}, { _id: false }); // Disable _id for subdocuments to save space

const monitorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  url: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['http', 'https', 'ping'],
    default: 'https'
  },
  interval: {
    type: Number,
    default: 5 // 5 minutes for free tier
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
  // Store only aggregated data, not individual pings
  totalChecks: {
    type: Number,
    default: 0
  },
  successfulChecks: {
    type: Number,
    default: 0
  },
  totalResponseTime: {
    type: Number,
    default: 0
  },
  // Store only last 24 hours of ping history (288 entries for 5-min intervals)
  pingHistory: [pingHistorySchema],
  
  // Store only recent incidents (last 30 days)
  lastIncident: Date,
  incidentCount: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
monitorSchema.index({ userId: 1, isActive: 1 });
monitorSchema.index({ lastChecked: 1 });

// Virtual for calculated fields
monitorSchema.virtual('uptime').get(function() {
  return this.totalChecks > 0 ? (this.successfulChecks / this.totalChecks) * 100 : 0;
});

monitorSchema.virtual('averageResponse').get(function() {
  return this.totalChecks > 0 ? this.totalResponseTime / this.totalChecks : 0;
});

// Method to add ping with automatic cleanup
monitorSchema.methods.addPing = function(status, responseTime, statusCode) {
  const ping = {
    timestamp: new Date(),
    status,
    responseTime,
    statusCode
  };
  
  // Add new ping
  this.pingHistory.push(ping);
  
  // Keep only last 288 pings (24 hours at 5-minute intervals)
  if (this.pingHistory.length > 288) {
    this.pingHistory = this.pingHistory.slice(-288);
  }
  
  // Update aggregated data
  this.totalChecks += 1;
  if (status === 'up') {
    this.successfulChecks += 1;
  }
  this.totalResponseTime += responseTime;
  
  // Update incident tracking
  if (status === 'down') {
    this.lastIncident = new Date();
    this.incidentCount += 1;
  }
  
  this.currentStatus = status;
  this.lastChecked = new Date();
};

module.exports = mongoose.model('Monitor', monitorSchema);
