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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors());

// Rate limiting - more generous for free tier
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ZenPinger Monitoring'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ZenPinger server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Start monitoring service with error handling
const startMonitoring = () => {
  try {
    // Check monitors every 5 minutes for free tier
    setInterval(() => {
      pingService.checkAllMonitors();
    }, 5 * 60 * 1000);

    // Initial check after 10 seconds
    setTimeout(() => {
      pingService.checkAllMonitors();
    }, 10000);

    console.log('Monitoring service started');
  } catch (error) {
    console.error('Failed to start monitoring service:', error);
  }
};

// Start monitoring after server is running
setTimeout(startMonitoring, 5000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
