// Vercel Serverless Entry Point
// Set VERCEL env before loading any modules
process.env.VERCEL = '1';

const app = require('../src/server');
module.exports = app;
