const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // Create indexes for better performance
    await mongoose.connection.collection('monitors').createIndex({ userId: 1, isActive: 1 });
    await mongoose.connection.collection('monitors').createIndex({ lastChecked: 1 });
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = connectDB;
