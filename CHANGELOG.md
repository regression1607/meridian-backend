# Meridian EMS - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Phase 2: Institution Website Builder
  - Custom subdomain websites (`{institution}.meridian-ems.com`)
  - Website builder dashboard with drag-and-drop
  - Dynamic theme system (CSS variables)
  - Content management (news, galleries, events)
  - SEO & Analytics integration
- Phase 3: Redis caching, AWS S3, Push/SMS notifications
- Phase 4: Mobile app (React Native), Enterprise features

### Added in Phase 1
- **Fee Management**: Fee structures, invoices, payments (Razorpay/Stripe), receipts
- **Parent Portal**: Child progress tracking, PTM scheduling, fee payment
- **Library Management**: Book catalog, issue/return, renewals, fines
- **Salary & Payroll**: Salary structures, payroll processing, payslips, tax calculation
- **Transport Management**: Routes, vehicles, student allocation, GPS tracking (Phase 2)
- **Hostel Management**: Room allocation, mess menu, visitor logs, complaints
- **Admission Management**: Online applications, document verification, merit lists, enrollment
- **Events Management**: Events, competitions, registrations, certificates
- **Multi-language (i18n)**: English, Hindi, Spanish, French, Arabic (RTL), Chinese, Portuguese, German
- **Security & Compliance**: Data encryption, GDPR/FERPA compliance, 2FA, audit logging

---

## [v1.0.0] - TBD

### Added
- Production release
- All core features stable
- Performance optimizations
- Security audit completed

---

## [v0.8.0] - TBD

### Added
- Reports and analytics dashboard
- Export reports to PDF/Excel
- Institution-wide statistics
- Performance trend analysis

---

## [v0.7.0] - TBD

### Added
- Leave management system
- Leave application workflow
- Leave approval by admin/coordinator
- Leave history and tracking
- Integration with attendance

---

## [v0.6.0] - TBD

### Added
- Examination system
- Exam scheduling
- Grade entry interface
- Report card generation
- AI-powered grading suggestions

---

## [v0.5.0] - TBD

### Added
- AI integration with Google Gemini via LangChain
- AI Question Paper Generator
  - Generate from topic names
  - Generate from previous year papers (PDF upload)
  - PDF text extraction
- AI-powered essay grading
- Plagiarism detection (basic)
- AI chatbot for students

---

## [v0.4.0] - TBD

### Added
- Attendance tracking system
- Calendar view for attendance
- Holiday management
- Calendar with events display
- Color-coded attendance visualization

---

## [v0.3.0] - TBD

### Added
- Homework & Assignment system
- Draft/Publish workflow
- Status management (draft → published → deleted)
- File attachments (MongoDB GridFS)
- Submission system
- Basic grading interface

---

## [v0.2.0] - TBD

### Added
- Class management
- Section management
- Subject management
- Timetable system
- Department management

---

## [v0.1.0] - TBD

### Added
- Initial project setup
- Authentication system
  - Email/password login
  - JWT tokens (access + refresh)
  - Password reset via email
  - Force password change on first login
- User management
  - Hierarchical account creation
  - Role-based access control
  - User profiles (Teacher, Student, Parent, Staff)
  - Bulk import (CSV)
- Institution management
  - Multi-tenant architecture
  - Institution settings
  - Academic year configuration
- MongoDB database setup
- File storage using MongoDB GridFS
- Basic API structure
- Response utilities (standardized responses)

### Technical
- Node.js + Express.js backend
- MongoDB with Mongoose ODM
- JWT authentication
- LangChain.js setup for AI
- Google Gemini API integration

---

## Version Naming Convention

| Version | Type | Description |
|---------|------|-------------|
| v0.x.x | Development | Pre-release, feature development |
| v1.0.0 | Production | First stable release |
| v1.x.0 | Minor | New features, backward compatible |
| v1.0.x | Patch | Bug fixes, security patches |

---

## Migration Notes

### v0.1.0 → v0.2.0
- No breaking changes
- Run database migrations for new collections

### v0.4.0 → v0.5.0
- Requires Google Gemini API key in environment
- New LangChain dependencies required

---

*Project: Meridian EMS*
*Maintained by: Meridian EMS Team*
