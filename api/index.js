// Vercel Serverless Entry Point
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Vercel is working' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Health check passed' });
});

// Try to load full app
let fullApp;
try {
  require('dotenv').config();
  fullApp = require('../src/server');
} catch (error) {
  console.error('Failed to load full app:', error.message);
  // Return error info on any route if full app fails
  app.use((req, res) => {
    res.status(500).json({ 
      error: 'App initialization failed', 
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  });
}

module.exports = fullApp || app;
