// Vercel Serverless Entry Point
process.env.VERCEL = '1';

const mongoose = require('mongoose');

// Cached connection for serverless
let cachedDb = null;

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
  return conn;
}

// Handler wrapper that ensures DB connection
const app = require('../src/server');

module.exports = async (req, res) => {
  await connectToDatabase();
  return app(req, res);
};
