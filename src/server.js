const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const emailService = require('./utils/emailService');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Connect to Database
connectDB();

// Initialize Email Service
emailService.initialize();

// CORS - must be before other middleware
// Allow all origins for now (can restrict later)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Security Middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use('/api', limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Meridian EMS API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Info
app.get(apiPrefix, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Meridian EMS API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      auth: `${apiPrefix}/auth`,
      users: `${apiPrefix}/users`,
      institutions: `${apiPrefix}/institutions`,
      classes: `${apiPrefix}/classes`,
      subjects: `${apiPrefix}/subjects`,
      homework: `${apiPrefix}/homework`,
      attendance: `${apiPrefix}/attendance`,
      exams: `${apiPrefix}/exams`,
      fees: `${apiPrefix}/fees`,
      library: `${apiPrefix}/library`,
      transport: `${apiPrefix}/transport`,
      hostel: `${apiPrefix}/hostel`,
      salary: `${apiPrefix}/salary`,
      admissions: `${apiPrefix}/admissions`,
      events: `${apiPrefix}/events`
    }
  });
});

// Route imports
app.use(`${apiPrefix}/auth`, require('./routes/auth.routes'));
app.use(`${apiPrefix}/users`, require('./routes/user.routes'));
app.use(`${apiPrefix}/institutions`, require('./routes/institution.routes'));
app.use(`${apiPrefix}/classes`, require('./routes/class.routes'));
app.use(`${apiPrefix}/subjects`, require('./routes/subject.routes'));
app.use(`${apiPrefix}/timetables`, require('./routes/timetable.routes'));
app.use(`${apiPrefix}/attendance`, require('./routes/attendance.routes'));
app.use(`${apiPrefix}/fees`, require('./routes/fee.routes'));
app.use(`${apiPrefix}/homework`, require('./routes/homework.routes'));
app.use(`${apiPrefix}/admissions`, require('./routes/admission.routes'));
app.use(`${apiPrefix}/transport`, require('./routes/transport.routes'));
app.use(`${apiPrefix}/library`, require('./routes/library.routes'));
app.use(`${apiPrefix}/hostel`, require('./routes/hostel.routes'));
app.use(`${apiPrefix}/payroll`, require('./routes/payroll.routes'));
app.use(`${apiPrefix}/events`, require('./routes/event.routes'));
app.use(`${apiPrefix}/reports`, require('./routes/report.routes'));
app.use(`${apiPrefix}/preferences`, require('./routes/preferences.routes'));
app.use(`${apiPrefix}/ai`, require('./routes/ai.routes'));
app.use(`${apiPrefix}/examinations`, require('./routes/exam.routes'));
app.use(`${apiPrefix}/notifications`, require('./routes/notification.routes'));
app.use(`${apiPrefix}/question-papers`, require('./routes/questionPaper.routes'));

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server (only in non-Vercel environment)
const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    logger.info(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🎓 MERIDIAN EMS - Education Management System          ║
  ║                                                           ║
  ║   Server running on port ${PORT}                            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
  ║   API: http://localhost:${PORT}${apiPrefix}                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

// Export for Vercel serverless
module.exports = app;
