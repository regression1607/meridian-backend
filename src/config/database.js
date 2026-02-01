const mongoose = require('mongoose');
const logger = require('../utils/logger');

let cachedConnection = null;

const connectDB = async () => {
  // Return cached connection for serverless warm starts
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('MONGODB_URI environment variable is not set');
      if (process.env.VERCEL !== '1') {
        process.exit(1);
      }
      throw new Error('MONGODB_URI is not configured');
    }

    // Connection options optimized for serverless
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(mongoUri, options);
    cachedConnection = conn;
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
      cachedConnection = null;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      cachedConnection = null;
    });

    // Graceful shutdown (skip in serverless)
    if (process.env.VERCEL !== '1') {
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
      });
    }

    return conn;

  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    cachedConnection = null;
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
