# Meridian EMS Backend - Code Structure

## 📋 Table of Contents
1. [Project Structure](#project-structure)
2. [Architecture Pattern](#architecture-pattern)
3. [Module Breakdown](#module-breakdown)
4. [Coding Standards](#coding-standards)
5. [Environment Configuration](#environment-configuration)

---

## Project Structure

```
Meridian EMS-backend/
│
├── docs/                          # Documentation
│   ├── 01-SYSTEM-OVERVIEW.md
│   ├── 02-DATABASE-SCHEMA.md
│   ├── 03-API-DOCUMENTATION.md
│   ├── 04-CODE-STRUCTURE.md
│   └── 05-AI-FEATURES.md
│
├── src/
│   ├── config/                    # Configuration files
│   │   ├── index.js               # Main config export
│   │   ├── database.js            # MongoDB connection
│   │   ├── gridfs.js              # MongoDB GridFS setup (file storage)
│   │   ├── cors.js                # CORS settings
│   │   ├── logger.js              # Winston logger config
│   │   └── swagger.js             # API documentation config
│   │
│   ├── constants/                 # Application constants
│   │   ├── index.js
│   │   ├── roles.js               # User roles enum
│   │   ├── permissions.js         # Permission definitions
│   │   ├── errorCodes.js          # Error code constants
│   │   └── status.js              # Status enums
│   │
│   ├── middleware/                # Express middleware
│   │   ├── auth.js                # JWT authentication
│   │   ├── authorize.js           # Role-based authorization
│   │   ├── validate.js            # Request validation
│   │   ├── errorHandler.js        # Global error handler
│   │   ├── rateLimiter.js         # Rate limiting
│   │   ├── upload.js              # File upload (multer)
│   │   ├── requestLogger.js       # Request logging
│   │   └── institutionContext.js  # Multi-tenant context
│   │
│   ├── models/                    # Mongoose models
│   │   ├── index.js               # Export all models
│   │   ├── Institution.js
│   │   ├── User.js
│   │   ├── Department.js
│   │   ├── Class.js
│   │   ├── Section.js
│   │   ├── Subject.js
│   │   ├── Homework.js
│   │   ├── Submission.js
│   │   ├── Attendance.js
│   │   ├── Exam.js
│   │   ├── Grade.js
│   │   ├── Timetable.js
│   │   ├── Announcement.js
│   │   ├── Notification.js
│   │   ├── Resource.js
│   │   ├── AIAnalytics.js
│   │   ├── ActivityLog.js
│   │   ├── Holiday.js             # Institution holidays
│   │   ├── LeaveRequest.js        # Leave applications
│   │   └── QuestionPaper.js       # AI-generated question papers
│   │
│   ├── routes/                    # API routes
│   │   ├── index.js               # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── institution.routes.js
│   │   ├── user.routes.js
│   │   ├── department.routes.js
│   │   ├── class.routes.js
│   │   ├── section.routes.js
│   │   ├── subject.routes.js
│   │   ├── homework.routes.js
│   │   ├── submission.routes.js
│   │   ├── attendance.routes.js
│   │   ├── exam.routes.js
│   │   ├── grade.routes.js
│   │   ├── timetable.routes.js
│   │   ├── announcement.routes.js
│   │   ├── notification.routes.js
│   │   ├── resource.routes.js
│   │   ├── ai.routes.js
│   │   ├── report.routes.js
│   │   ├── upload.routes.js
│   │   ├── holiday.routes.js      # Holiday management
│   │   ├── leave.routes.js        # Leave requests
│   │   ├── calendar.routes.js     # Calendar data
│   │   └── questionPaper.routes.js # AI question paper generation
│   │
│   ├── controllers/               # Route controllers
│   │   ├── auth.controller.js
│   │   ├── institution.controller.js
│   │   ├── user.controller.js
│   │   ├── department.controller.js
│   │   ├── class.controller.js
│   │   ├── section.controller.js
│   │   ├── subject.controller.js
│   │   ├── homework.controller.js
│   │   ├── submission.controller.js
│   │   ├── attendance.controller.js
│   │   ├── exam.controller.js
│   │   ├── grade.controller.js
│   │   ├── timetable.controller.js
│   │   ├── announcement.controller.js
│   │   ├── notification.controller.js
│   │   ├── resource.controller.js
│   │   ├── ai.controller.js
│   │   ├── report.controller.js
│   │   └── upload.controller.js
│   │
│   ├── services/                  # Business logic
│   │   ├── auth.service.js
│   │   ├── institution.service.js
│   │   ├── user.service.js
│   │   ├── department.service.js
│   │   ├── class.service.js
│   │   ├── section.service.js
│   │   ├── subject.service.js
│   │   ├── homework.service.js
│   │   ├── submission.service.js
│   │   ├── attendance.service.js
│   │   ├── exam.service.js
│   │   ├── grade.service.js
│   │   ├── timetable.service.js
│   │   ├── announcement.service.js
│   │   ├── notification.service.js
│   │   ├── resource.service.js
│   │   ├── report.service.js
│   │   └── email.service.js
│   │
│   ├── services/ai/               # AI-specific services (LangChain + Gemini)
│   │   ├── index.js
│   │   ├── langchain.service.js   # LangChain setup & model switching
│   │   ├── gemini.service.js      # Google Gemini API integration
│   │   ├── plagiarism.service.js  # Plagiarism detection
│   │   ├── grading.service.js     # Auto-grading
│   │   ├── analytics.service.js   # Student analytics
│   │   ├── scheduling.service.js  # Timetable generation
│   │   ├── chatbot.service.js     # AI chatbot
│   │   ├── questionPaper.service.js # Question paper generation
│   │   ├── pdfExtractor.service.js  # Extract text from PDFs
│   │   └── prompts/               # AI prompt templates
│   │       ├── grading.prompts.js
│   │       ├── questions.prompts.js
│   │       └── chatbot.prompts.js
│   │
│   ├── validators/                # Joi/Zod validation schemas
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── homework.validator.js
│   │   ├── attendance.validator.js
│   │   └── common.validator.js
│   │
│   ├── responses/                 # Standardized API responses (NO DUPLICATE CODE)
│   │   ├── index.js               # Export all response helpers
│   │   ├── success.response.js    # Success response formats
│   │   ├── error.response.js      # Error response formats
│   │   ├── pagination.response.js # Paginated response format
│   │   └── codes.js               # HTTP status codes & messages
│   │
│   ├── utils/                     # Utility functions
│   │   ├── apiError.js            # Custom error class
│   │   ├── asyncHandler.js        # Async error wrapper
│   │   ├── jwt.js                 # JWT utilities
│   │   ├── hash.js                # Password hashing
│   │   ├── pagination.js          # Pagination helper
│   │   ├── gridfsUpload.js        # MongoDB GridFS file upload
│   │   ├── emailTemplates.js      # Email templates
│   │   ├── generateCode.js        # Code generators
│   │   └── dateUtils.js           # Date utilities
│   │
│   ├── jobs/                      # Background jobs (Bull/Agenda)
│   │   ├── index.js
│   │   ├── emailJob.js            # Send emails
│   │   ├── notificationJob.js     # Push notifications
│   │   ├── reportJob.js           # Generate reports
│   │   ├── cleanupJob.js          # Data cleanup
│   │   └── aiAnalysisJob.js       # AI background tasks
│   │
│   ├── sockets/                   # Socket.io handlers
│   │   ├── index.js
│   │   ├── notifications.js       # Real-time notifications
│   │   └── chat.js                # Real-time messaging
│   │
│   ├── app.js                     # Express app setup
│   └── server.js                  # Server entry point
│
├── tests/                         # Test files
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── user.test.js
│   │   └── homework.test.js
│   ├── fixtures/                  # Test data
│   └── setup.js                   # Test setup
│
├── scripts/                       # Utility scripts
│   ├── seed.js                    # Database seeding
│   ├── migrate.js                 # Data migrations
│   └── createAdmin.js             # Create super admin
│
├── .env.example                   # Environment template
├── .gitignore
├── .eslintrc.js                   # ESLint config
├── .prettierrc                    # Prettier config
├── package.json
├── package-lock.json
└── README.md
```

---

## Architecture Pattern

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROUTES LAYER                             │
│         (Define endpoints, attach middleware, validators)        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                            │
│    (Handle HTTP request/response, call services, format data)   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                             │
│         (Business logic, data manipulation, validations)        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MODEL LAYER                              │
│            (Database schemas, queries, relationships)           │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
HTTP Request
    │
    ▼
┌─────────────┐
│  Middleware │ → Auth → Rate Limit → Validate → Institution Context
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Route     │ → Match endpoint
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │ → Parse request, call service
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │ → Business logic, DB operations
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Model     │ → MongoDB operations
└──────┬──────┘
       │
       ▼
HTTP Response
```

---

## Module Breakdown

### 1. Config Module

```javascript
// src/config/index.js
module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  mongoose: {
    url: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 60,
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || 30,
  },
  
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
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
    from: process.env.EMAIL_FROM,
  },
  
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    s3Bucket: process.env.AWS_S3_BUCKET,
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
  },
};
```

### 2. Model Example

```javascript
// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
    },
    // ... other fields
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Query middleware to exclude deleted
userSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('User', userSchema);
```

### 3. Route Example

```javascript
// src/routes/homework.routes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const homeworkValidator = require('../validators/homework.validator');
const homeworkController = require('../controllers/homework.controller');
const { ROLES } = require('../constants/roles');

router.use(auth); // All routes require authentication

router
  .route('/')
  .get(homeworkController.getHomework)
  .post(
    authorize(ROLES.TEACHER, ROLES.COORDINATOR, ROLES.INSTITUTION_ADMIN),
    validate(homeworkValidator.createHomework),
    homeworkController.createHomework
  );

router
  .route('/:id')
  .get(homeworkController.getHomeworkById)
  .put(
    authorize(ROLES.TEACHER, ROLES.COORDINATOR, ROLES.INSTITUTION_ADMIN),
    validate(homeworkValidator.updateHomework),
    homeworkController.updateHomework
  )
  .delete(
    authorize(ROLES.TEACHER, ROLES.COORDINATOR, ROLES.INSTITUTION_ADMIN),
    homeworkController.deleteHomework
  );

router.post(
  '/:id/publish',
  authorize(ROLES.TEACHER),
  homeworkController.publishHomework
);

router.get(
  '/:id/submissions',
  authorize(ROLES.TEACHER, ROLES.COORDINATOR),
  homeworkController.getSubmissions
);

module.exports = router;
```

### 4. Controller Example

```javascript
// src/controllers/homework.controller.js
const homeworkService = require('../services/homework.service');
const { ApiResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getHomework = asyncHandler(async (req, res) => {
  const { page, limit, subject, status, dueDate } = req.query;
  const filters = {
    institution: req.user.institution,
    ...(req.user.role === 'student' && { class: req.user.studentProfile.class }),
    ...(subject && { subject }),
    ...(status && { status }),
  };
  
  const result = await homeworkService.getHomework(filters, { page, limit });
  
  res.json(ApiResponse.success('Homework fetched successfully', result.data, result.meta));
});

exports.createHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.createHomework({
    ...req.body,
    institution: req.user.institution,
    assignedBy: req.user._id,
  });
  
  res.status(201).json(ApiResponse.success('Homework created successfully', homework));
});

exports.getHomeworkById = asyncHandler(async (req, res) => {
  const homework = await homeworkService.getHomeworkById(req.params.id, req.user);
  res.json(ApiResponse.success('Homework fetched', homework));
});

exports.updateHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.updateHomework(
    req.params.id,
    req.body,
    req.user
  );
  res.json(ApiResponse.success('Homework updated', homework));
});

exports.deleteHomework = asyncHandler(async (req, res) => {
  await homeworkService.deleteHomework(req.params.id, req.user);
  res.json(ApiResponse.success('Homework deleted'));
});

exports.publishHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.publishHomework(req.params.id, req.user);
  res.json(ApiResponse.success('Homework published', homework));
});

exports.getSubmissions = asyncHandler(async (req, res) => {
  const submissions = await homeworkService.getSubmissions(req.params.id, req.query);
  res.json(ApiResponse.success('Submissions fetched', submissions));
});
```

### 5. Service Example

```javascript
// src/services/homework.service.js
const Homework = require('../models/Homework');
const Submission = require('../models/Submission');
const notificationService = require('./notification.service');
const ApiError = require('../utils/apiError');

class HomeworkService {
  async getHomework(filters, options) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Homework.find(filters)
        .populate('subject', 'name code')
        .populate('class', 'name')
        .populate('assignedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Homework.countDocuments(filters),
    ]);

    return {
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createHomework(data) {
    const homework = await Homework.create(data);
    return homework;
  }

  async getHomeworkById(id, user) {
    const homework = await Homework.findById(id)
      .populate('subject class section assignedBy');
    
    if (!homework) {
      throw new ApiError(404, 'Homework not found');
    }

    // If student, include their submission
    if (user.role === 'student') {
      const submission = await Submission.findOne({
        homework: id,
        student: user._id,
      });
      return { ...homework.toObject(), mySubmission: submission };
    }

    return homework;
  }

  async updateHomework(id, data, user) {
    const homework = await Homework.findById(id);
    
    if (!homework) {
      throw new ApiError(404, 'Homework not found');
    }

    // Check ownership
    if (homework.assignedBy.toString() !== user._id.toString() && 
        !['institution_admin', 'coordinator'].includes(user.role)) {
      throw new ApiError(403, 'Not authorized to update this homework');
    }

    Object.assign(homework, data);
    await homework.save();
    return homework;
  }

  async deleteHomework(id, user) {
    const homework = await Homework.findById(id);
    
    if (!homework) {
      throw new ApiError(404, 'Homework not found');
    }

    homework.isDeleted = true;
    await homework.save();
  }

  async publishHomework(id, user) {
    const homework = await Homework.findById(id);
    
    if (!homework) {
      throw new ApiError(404, 'Homework not found');
    }

    homework.status = 'published';
    await homework.save();

    // Send notifications to students
    await notificationService.notifyClassStudents(
      homework.class,
      homework.section,
      {
        type: 'homework',
        title: 'New Homework Assigned',
        message: `${homework.title} - Due: ${homework.dueDate}`,
        reference: { type: 'homework', id: homework._id },
      }
    );

    return homework;
  }

  async getSubmissions(homeworkId, options) {
    const { page = 1, limit = 50, status } = options;
    
    const filters = { homework: homeworkId };
    if (status) filters.status = status;

    const submissions = await Submission.find(filters)
      .populate('student', 'firstName lastName studentProfile.rollNumber')
      .sort({ submittedAt: -1 });

    return submissions;
  }
}

module.exports = new HomeworkService();
```

---

## Coding Standards

### 1. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | camelCase | `userController.js` |
| Classes | PascalCase | `UserService` |
| Functions | camelCase | `getUserById` |
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Database fields | camelCase | `firstName` |

### 2. File Organization
- One model per file
- One controller per resource
- Services contain business logic
- Utils are pure, reusable functions

### 3. Error Handling
```javascript
// Always use ApiError for known errors
throw new ApiError(404, 'User not found');
throw new ApiError(400, 'Invalid input', errors);

// Use asyncHandler to catch async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### 4. Response Format
```javascript
// Always use ApiResponse utility
res.json(ApiResponse.success('Message', data, meta));
res.status(201).json(ApiResponse.created('Created', data));
res.json(ApiResponse.error('Error message', errorCode, details));
```

---

## Environment Configuration

### .env.example

```env
# Application
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# MongoDB
MONGODB_URI=mongodb://localhost:27017/meridian_ems

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRATION_MINUTES=60
JWT_REFRESH_EXPIRATION_DAYS=30

# Email (SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=noreply@meridian-ems.com

# AWS S3 (File Storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=meridian-ems-uploads

# OpenAI (AI Features)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FORMAT=dev
```

---

## Dependencies

### package.json (Key Dependencies)

```json
{
  "name": "meridian-ems-backend",
  "version": "1.0.0",
  "description": "AI-enabled education management platform",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "lint": "eslint src/",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "joi": "^17.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^7.1.0",
    "multer": "^1.4.5-lts.1",
    "aws-sdk": "^2.1500.0",
    "nodemailer": "^6.9.0",
    "socket.io": "^4.7.0",
    "ioredis": "^5.3.0",
    "bull": "^4.12.0",
    "openai": "^4.20.0",
    "dayjs": "^1.11.10"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Project: Meridian EMS*
