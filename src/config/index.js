require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appName: process.env.APP_NAME || 'Meridian EMS',
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  mongoose: {
    url: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    accessExpirationMinutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES) || 60,
    refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS) || 30,
  },

  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@meridian-ems.com',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};
