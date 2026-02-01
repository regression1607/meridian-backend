// Vercel Serverless Entry Point
process.env.VERCEL = '1';

const mongoose = require('mongoose');

// Cached connection and app
let cachedDb = null;
let cachedApp = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  
  cachedDb = conn;
  console.log('MongoDB connected in serverless');
  return conn;
}

async function getApp() {
  // Connect to DB first, BEFORE loading server/models
  await connectToDatabase();
  
  if (!cachedApp) {
    // Only require server AFTER DB is connected
    cachedApp = require('../src/server');
  }
  return cachedApp;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
