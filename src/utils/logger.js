const winston = require('winston');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ]
});

// Skip file logging on serverless (Vercel, AWS Lambda, etc.)
// These environments don't have persistent filesystem
const isServerless = !!(
  process.env.VERCEL || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.NETLIFY
);

// Add file transport only in non-serverless production
if (process.env.NODE_ENV === 'production' && !isServerless) {
  const path = require('path');
  const fs = require('fs');
  const logsDir = path.join(process.cwd(), 'logs');
  
  // Only add file transport if we can create the logs directory
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    logger.add(new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    }));
    logger.add(new winston.transports.File({
      filename: path.join(logsDir, 'combined.log')
    }));
  } catch (err) {
    // Silently skip file logging if directory creation fails
    console.warn('File logging disabled - could not create logs directory');
  }
}

module.exports = logger;
