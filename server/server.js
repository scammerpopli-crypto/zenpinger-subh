require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');
const pingService = require('./utils/pingService');

// Import routes
const authRoutes = require('./routes/auth');
const monitorRoutes = require('./routes/monitors');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Reduced for storage conservation
  message: 'Too many requests'
});
app.use('/api/', limiter);

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Optimized monitoring intervals
const MONITOR_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000; // Weekly

// Start monitoring
setInterval(() => {
  pingService.checkAllMonitors();
}, MONITOR_INTERVAL);

// Weekly cleanup
setInterval(() => {
  pingService.cleanupOldData();
}, CLEANUP_INTERVAL);

// Initial check
setTimeout(() => {
  pingService.checkAllMonitors();
}, 10000);
