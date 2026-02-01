# Meridian EMS - System Overview

## 🎯 Vision
**Meridian EMS** is an AI-enabled, scalable education management platform designed for modern educational institutions - from primary schools to colleges and universities.

---

## 📋 Table of Contents
1. [Platform Overview](#platform-overview)
2. [Supported Institution Types](#supported-institution-types)
3. [User Roles & Hierarchy](#user-roles--hierarchy)
4. [Authentication System](#authentication-system)
5. [Core Features](#core-features)
6. [AI Capabilities](#ai-capabilities)
7. [System Architecture](#system-architecture)
8. [Development Phases](#development-phases)
9. [Version History](#version-history)

---

## Platform Overview

### What is Meridian EMS?
Meridian EMS is a comprehensive education management system that streamlines administrative tasks, enhances communication, and leverages AI to improve learning outcomes.

### Key Value Propositions
- **Multi-Institution Support**: One platform for schools, colleges, and universities
- **Role-Based Access**: Hierarchical permission system
- **AI-Powered**: Smart analytics, automated grading, personalized learning
- **Scalable**: From 50 students to 50,000+
- **Modern Stack**: Node.js backend, React frontend, MongoDB database

---

## Supported Institution Types

### 1. Primary Schools (Grades 1-5)
| Feature | Configuration |
|---------|---------------|
| Grade Structure | Grade 1 - Grade 5 |
| Assessment Type | Simplified grading (A, B, C, D, E) |
| Parent Portal | Full access required |
| Homework | Visual, simple assignments |

### 2. Middle Schools (Grades 6-8)
| Feature | Configuration |
|---------|---------------|
| Grade Structure | Grade 6 - Grade 8 |
| Assessment Type | Percentage + Grade |
| Parent Portal | Optional |
| Homework | Standard assignments |

### 3. Secondary/High Schools (Grades 9-12)
| Feature | Configuration |
|---------|---------------|
| Grade Structure | Grade 9 - Grade 12 |
| Assessment Type | GPA, Percentage, Credits |
| Parent Portal | Optional |
| Features | Subject specialization, Exams |

### 4. Colleges/Universities
| Feature | Configuration |
|---------|---------------|
| Structure | Semesters, Departments, Courses |
| Assessment Type | Credits, CGPA, Grade Points |
| Parent Portal | Disabled by default |
| Features | Course registration, Faculty management |

### 5. Coaching Institutes / Training Centers
| Feature | Configuration |
|---------|---------------|
| Structure | Batches, Courses, Programs |
| Assessment Type | Test scores, Rankings |
| Features | Batch management, Test series |

---

## User Roles & Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN                                │
│            (Platform Owner / Multi-Institution)                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    INSTITUTION ADMIN                            │
│              (Principal / Director / Dean)                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
│  COORDINATOR  │ │   TEACHER     │ │    STAFF      │
│ (HOD/Manager) │ │   (Faculty)   │ │  (Non-teach)  │
└───────┬───────┘ └───────┬───────┘ └───────────────┘
        │                 │
        └────────┬────────┘
                 │
┌────────────────▼────────────────┐
│            STUDENT              │
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│         PARENT/GUARDIAN         │
│         (View Only Access)      │
└─────────────────────────────────┘
```

### Role Permissions Matrix

| Permission | Super Admin | Institution Admin | Coordinator | Teacher | Student | Parent |
|------------|:-----------:|:-----------------:|:-----------:|:-------:|:-------:|:------:|
| Manage Institutions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Teachers | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Students | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Classes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign Homework | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Submit Homework | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Grades | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Grade Students | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Analytics | ✅ | ✅ | ✅ | ✅ | 🔶 | 🔶 |

✅ = Full Access | 🔶 = Limited Access | ❌ = No Access

---

## Authentication System

### Login Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HIERARCHICAL ACCOUNT CREATION                     │
└─────────────────────────────────────────────────────────────────────┘

1. Super Admin (Platform Owner)
   └── Creates Institution Admin accounts (email + temporary password)
       └── Institution Admin creates:
           ├── Coordinator accounts
           ├── Teacher accounts
           ├── Staff accounts
           └── Student accounts (can also create Parent accounts)

┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIN PROCESS                                │
└─────────────────────────────────────────────────────────────────────┘

1. User receives email with login credentials from their admin
2. User logs in with email + password
3. On first login → Prompted to change password
4. JWT token issued for session management
5. User can reset password via "Forgot Password" (email verification)
```

### Authentication Features

| Feature | Description |
|---------|-------------|
| Email/Password Login | Primary authentication method |
| Password Reset | Via email verification link |
| Force Password Change | On first login with temporary password |
| Session Management | JWT tokens (access + refresh) |
| Account Activation | Admin creates account → User receives email |
| Account Deactivation | Admin can disable accounts (soft disable) |

### Password Policy
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 number
- Password reset link expires in 1 hour
- Last 5 passwords cannot be reused

---

## Core Features

### 1. Institution Management
- Multi-tenant architecture
- Custom branding per institution
- Academic year/semester configuration
- Department/Grade management

### 2. User Management
- Hierarchical account creation (admin creates subordinate accounts)
- Bulk import (CSV/Excel)
- Profile management
- Authentication (JWT-based)
- Password reset via email

### 3. Academic Management
- Class/Section creation
- Subject assignment
- Timetable scheduling
- Attendance tracking

### 4. Homework & Assignments
- Create assignments with deadlines
- File attachments support (stored in MongoDB)
- Online submission
- **Draft/Publish System**: Save as draft, publish when ready
- **Status Management**: `draft` → `published` → `deleted` (soft delete)
- Plagiarism detection (AI)

### 5. Examination & Grading
- Create exams/tests (AI-powered question paper generation)
- Online assessments
- Manual/Auto grading (AI)
- Report card generation
- Grade analytics
- **AI Question Paper Generator**:
  - Generate from topic names
  - Upload previous year papers (PDF) → AI extracts and generates new questions

### 6. Communication
- Announcements
- Direct messaging
- Notifications (Push, Email, SMS)
- Parent-Teacher communication

### 7. Resources & Library 
- Digital resource sharing - links to external resources
- Study materials - links to external resources
- Video lectures integration - links to external resources
- E-Library management

### 8. Calendar & Leave Management
- **Visual Calendar**: View attendance, holidays, events
- **Attendance Tracking**: Color-coded calendar view
- **Holiday Calendar**: Institution holidays, public holidays
- **Leave Application**: Students/Teachers can apply for leave
- **Leave Approval**: Admin/Coordinator approves/rejects leave requests

### 9. Status System (Draft/Publish)

All content items support status workflow:

| Status | Description |
|--------|-------------|
| `draft` | Work in progress, not visible to others |
| `published` | Active and visible to intended audience |
| `deleted` | Soft deleted, hidden but recoverable |

**Applies to**: Homework, Announcements, Exams, Resources, Question Papers

### 10. Parent Portal
- **Child Progress Tracking**: View grades, attendance, homework status
- **Fee Payment**: Pay fees online (integrated payment gateway)
- **PTM Scheduling**: Book Parent-Teacher Meeting slots
- **Communication**: Direct messaging with teachers
- **Notifications**: Real-time alerts for important events
- **Report Cards**: Download progress reports

### 11. Fee Management
- **Fee Structure**: Define fee heads (Tuition, Transport, Lab, etc.)
- **Fee Plans**: Installment plans, discounts, scholarships
- **Invoice Generation**: Automatic invoice creation
- **Payment Tracking**: Track paid/pending/overdue fees
- **Payment Gateway**: Online payment (Razorpay/Stripe)
- **Receipts**: Digital receipts with download option
- **Fee Reports**: Collection reports, defaulter lists
- **Late Fee**: Auto-calculate late payment penalties

### 12. Transport Management
- **Route Management**: Define bus routes with stops
- **Vehicle Tracking**: GPS-based real-time tracking (Phase 2)
- **Driver/Conductor Management**: Assign staff to vehicles
- **Student Allocation**: Assign students to routes
- **Transport Fees**: Integrate with fee management
- **Notifications**: Arrival alerts to parents
- **Route Optimization**: AI-suggested optimal routes

### 13. Library Management
- **Book Catalog**: Digital inventory of books
- **Book Issue/Return**: Track borrowing with due dates
- **Fine Management**: Auto-calculate overdue fines
- **Reservations**: Book reservation system
- **Digital Resources**: E-books, journals access
- **Barcode/QR Scanning**: Quick issue/return
- **Reports**: Popular books, overdue list, inventory

### 14. Hostel Management
- **Room Allocation**: Manage rooms, beds, floors
- **Student Assignment**: Assign students to rooms
- **Mess Management**: Meal plans, menu scheduling
- **Attendance**: Hostel check-in/check-out
- **Visitor Log**: Track visitor entries
- **Complaints**: Room/facility complaint system
- **Fee Integration**: Hostel fees linked to fee management

### 15. Salary & Payroll Management
- **Employee Database**: Staff salary details, bank info
- **Salary Structure**: Basic, HRA, DA, allowances, deductions
- **Payroll Processing**: Monthly salary calculation
- **Payslip Generation**: Digital payslips with download
- **Tax Calculation**: TDS, PF, ESI auto-calculation
- **Payment Modes**: Bank transfer, cash, cheque tracking
- **Reports**: Salary register, tax reports, PF reports
- **Leave Integration**: Salary adjustments for unpaid leave

### 16. Admission Management
- **Online Application Forms**: Customizable admission forms
- **Document Upload**: Birth certificate, photos, previous marksheets
- **Document Verification**: Admin verifies uploaded documents
- **Application Tracking**: Applicants track status (submitted → under review → approved/rejected)
- **Entrance Test**: Schedule tests, record scores
- **Merit List**: Auto-generate merit lists based on criteria
- **Seat Allocation**: Class/section assignment
- **Fee Link**: Generate admission fee invoice
- **Communication**: Auto-emails for status updates
- **Bulk Import**: Import from previous year data

### 17. Events Management
- **Event Creation**: Create school/college events
- **Event Types**: Academic, Sports, Cultural, Competition, Workshop, Seminar
- **Registration**: Student/participant registration
- **Scheduling**: Date, time, venue management
- **Notifications**: Event reminders to participants
- **Competitions**: 
  - Categories and rounds
  - Judge assignment
  - Score entry
  - Winner declaration
- **Certificates**: Auto-generate participation/winner certificates
- **Photo Gallery**: Event photo uploads
- **Calendar Integration**: Events show in institution calendar
- **Reports**: Participation reports, event history

---

## Security & Compliance

### Data Protection
- **Encryption at Rest**: All sensitive data encrypted in database
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Password Security**: bcrypt hashing, minimum complexity requirements
- **Session Management**: Secure JWT tokens, auto-expiry

### Compliance
- **GDPR Compliance**: For EU users
  - Right to access personal data
  - Right to data deletion
  - Data export functionality
  - Consent management
- **FERPA Compliance**: For US educational institutions
- **Data Localization**: Option for regional data storage

### Access Control
- **Role-Based Access Control (RBAC)**: Granular permissions
- **Audit Logging**: Track all user actions
- **Two-Factor Authentication (2FA)**: Optional extra security
- **IP Whitelisting**: Restrict admin access by IP

### Data Backup
- **Automated Backups**: Daily database backups
- **Point-in-Time Recovery**: Restore to any point
- **Disaster Recovery**: Multi-region backup storage

---

## Internationalization (i18n) - Worldwide Support

### Multi-Language Support
Meridian EMS supports multiple languages for worldwide deployment:

| Language | Code | Status |
|----------|------|--------|
| English | `en` | Default |
| Hindi | `hi` | Supported |
| Spanish | `es` | Supported |
| French | `fr` | Supported |
| Arabic | `ar` | Supported (RTL) |
| Chinese | `zh` | Supported |
| Portuguese | `pt` | Supported |
| German | `de` | Supported |

### Implementation
```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTERNATIONALIZATION (i18n)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Frontend (React-i18next)      Backend (i18n)                      │
│  ├── /locales/en.json          ├── Email templates per language   │
│  ├── /locales/hi.json          ├── PDF reports per language       │
│  ├── /locales/es.json          ├── Error messages                 │
│  └── Language selector         └── Notification texts             │
│                                                                     │
│  Features:                                                         │
│  - Auto-detect browser language                                    │
│  - User preference saved in profile                                │
│  - Institution default language                                    │
│  - RTL support for Arabic, Hebrew                                  │
│  - Date/Time format localization                                   │
│  - Currency format localization                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Regional Settings
- **Date Formats**: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- **Time Formats**: 12-hour, 24-hour
- **Currency**: INR, USD, EUR, GBP, etc.
- **Timezone**: Institution-specific timezone

---

## AI Capabilities

### 🤖 AI Features for Marketing & Functionality

#### 1. Smart Analytics Dashboard
- **Predictive Performance**: AI predicts student performance trends
- **At-Risk Student Detection**: Identifies students who may need help
- **Attendance Patterns**: Detects concerning attendance patterns

#### 2. AI-Powered Grading
- **Auto-Grade Essays**: NLP-based essay evaluation
- **MCQ Auto-Generation**: Generate questions from content
- **Plagiarism Detection**: Check assignment originality

#### 3. Personalized Learning
- **Learning Path Recommendations**: Custom study plans
- **Difficulty Adjustment**: Adaptive question difficulty
- **Resource Suggestions**: AI recommends study materials

#### 4. Smart Scheduling
- **Optimal Timetable**: AI-generated conflict-free schedules
- **Exam Scheduling**: Optimal exam date suggestions
- **Resource Allocation**: Smart classroom assignment

#### 5. Communication AI
- **Smart Notifications**: Priority-based alerts
- **Chatbot Support**: 24/7 query resolution
- **Sentiment Analysis**: Monitor communication tone

#### 6. Administrative AI
- **Document Processing**: OCR for certificates
- **Report Generation**: Auto-generated insights
- **Anomaly Detection**: Detect unusual patterns

---

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                  │
├──────────────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App (React Native)  │  Admin Panel       │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 │ HTTPS/WSS
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                         API GATEWAY                                   │
│                    (Rate Limiting, Auth, Logging)                     │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                       BACKEND SERVICES                                │
├──────────────────────────────────────────────────────────────────────┤
│  Auth Service  │  User Service  │  Academic Service  │  AI Service   │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────▼───────┐
│   MongoDB     │
│  (Primary DB  │
│  + Files)     │
└───────────────┘

Phase 2 (Future):
┌───────────────┐      ┌─────────────────┐
│  Redis Cache  │      │   AWS S3        │
│  (Sessions)   │      │  (File Storage) │
└───────────────┘      └─────────────────┘
```

### Technology Stack

#### Phase 1 (Current)
| Layer | Technology |
|-------|------------|
| Frontend | React.js (Vite), TailwindCSS, Redux Toolkit |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| File Storage | **MongoDB GridFS** (images, PDFs stored in DB) |
| Authentication | JWT (access + refresh tokens) |
| AI/ML | **Google Gemini API via LangChain** |
| Real-time | Socket.io |
| Notifications | NodeMailer (Email) |

#### Phase 2 (Future Enhancements)
| Layer | Technology |
|-------|------------|
| Cache | Redis (session management, caching) |
| File Storage | AWS S3 (migrate from MongoDB GridFS) |
| Notifications | Firebase FCM (Push), Twilio (SMS) |
| AI/ML | Multiple providers via LangChain |

---

## Subscription Tiers (Business Model)

### 1. Trial (14 Days Free)
- Up to 50 students
- Basic features only
- No AI features
- Email support

### 2. Basic Plan
- Up to 500 students
- Core features
- Limited AI (analytics only)
- Email support

### 3. Professional Plan
- Up to 2,000 students
- All features
- Full AI capabilities
- Priority support
- Custom branding

### 4. Enterprise Plan
- Unlimited students
- All features + Custom development
- Dedicated AI models
- 24/7 support
- On-premise option

---

## Next Steps

1. **Database Schema Design** → `02-DATABASE-SCHEMA.md`
2. **API Documentation** → `03-API-DOCUMENTATION.md`
3. **Code Structure** → `04-CODE-STRUCTURE.md`
4. **AI Features Detail** → `05-AI-FEATURES.md`
5. **Deployment Guide** → `06-DEPLOYMENT.md`

---

## Development Phases

### Phase 1 - MVP (Current)
- Core authentication (email/password)
- User management (hierarchical creation)
- Class, Section, Subject management
- Homework with draft/publish system
- Basic attendance tracking
- Calendar view
- AI integration (Gemini via LangChain)
- File storage in MongoDB
- **Fee Management**: Fee structures, payments, receipts
- **Parent Portal**: Progress tracking, PTM scheduling
- **Library Management**: Book catalog, issue/return, fines
- **Salary Management**: Payroll, payslips, tax calculation
- **Transport Management**: Routes, student allocation
- **Hostel Management**: Room allocation, mess menu
- **Multi-language (i18n)**: English, Hindi, Spanish, French, Arabic, etc.
- **Security**: Encryption, GDPR compliance, audit logs

### Phase 2 - Institution Website Builder
- **Custom Subdomain Websites**: Each institution gets `{institution}.meridian-ems.com`
  - Example: `abcd.meridian-ems.com`, `springfield.meridian-ems.com`
- **Website Builder Dashboard**: Institutions can customize their public website
  - Drag-and-drop page builder
  - Pre-built templates
  - Custom pages (About, Admissions, Faculty, etc.)
- **Dynamic Configuration**:
  - All settings stored in database/config (not hardcoded)
  - Easy changes via `.env` for global settings
  - Institution-specific settings in admin panel
- **Theme System**:
  - Multiple pre-built themes
  - Custom color picker
  - Logo and branding upload
  - CSS variables for easy customization
- **Content Management**:
  - News and announcements
  - Photo galleries
  - Events calendar (public)
  - Contact forms
- **SEO & Analytics**:
  - Meta tags configuration
  - Google Analytics integration
  - Sitemap generation

**Architecture for Dynamic/Scalable Setup:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                    DYNAMIC CONFIGURATION                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  .env (Global)              Database (Per Institution)             │
│  ├── APP_NAME               ├── institutionName                    │
│  ├── BASE_DOMAIN            ├── subdomain                          │
│  ├── DEFAULT_THEME          ├── theme settings                     │
│  ├── API_URL                ├── logo, colors                       │
│  └── FEATURE_FLAGS          └── custom pages                       │
│                                                                     │
│  Frontend Config Service:                                          │
│  - Loads config on app start                                       │
│  - CSS variables for theming                                       │
│  - Feature toggles                                                 │
│  - Easy to swap any component                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 3 - Enhanced
- Redis caching for performance
- AWS S3 for file storage
- Push notifications (Firebase)
- SMS notifications (Twilio)
- Advanced AI features
- Mobile app (React Native)

### Phase 4 - Enterprise
- Multi-tenant isolation
- Custom branding
- Advanced analytics
- API for third-party integrations
- On-premise deployment option

---

## Version History

| Version | Date | Features |
|---------|------|----------|
| v0.1.0 | TBD | Initial setup, authentication, user management |
| v0.2.0 | TBD | Classes, sections, subjects, timetable |
| v0.3.0 | TBD | Homework system with draft/publish |
| v0.4.0 | TBD | Attendance tracking, calendar view |
| v0.5.0 | TBD | AI integration (Gemini), question paper generation |
| v0.6.0 | TBD | Examination and grading system |
| v0.7.0 | TBD | Leave management system |
| v0.8.0 | TBD | Reports and analytics |
| v1.0.0 | TBD | Production release |

*See `CHANGELOG.md` for detailed version history*

---

*Document Version: 1.1*
*Last Updated: January 2025*
*Project: Meridian EMS*
