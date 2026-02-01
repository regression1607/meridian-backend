// Vercel Serverless Entry Point
require('dotenv').config();
const app = require('../src/server');

// Export as serverless function
module.exports = app;
