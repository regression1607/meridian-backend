# Meridian EMS - API Documentation

## 📋 Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)

---

## API Overview

### Base URL
```
Development: http://localhost:5000/api/v1
Production: https://api.meridian-ems.com/api/v1
```

### Request/Response Format
- All requests/responses use **JSON**
- Content-Type: `application/json`
- UTF-8 encoding

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [...]
  }
}
```

---

## Authentication

### JWT Authentication

All protected routes require Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Endpoints

#### POST /auth/register
Register a new user (institution admin during onboarding)

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@school.com",
  "password": "SecurePass123!",
  "role": "institution_admin",
  "institution": {
    "name": "Springfield High School",
    "type": "secondary",
    "email": "info@springfield.edu",
    "phone": "+1234567890"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "_id": "...",
      "email": "john@school.com",
      "role": "institution_admin"
    },
    "institution": {
      "_id": "...",
      "name": "Springfield High School",
      "code": "SHS001"
    }
  }
}
```

#### POST /auth/login
Login with email and password

**Request:**
```json
{
  "email": "john@school.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 3600,
    "user": {
      "_id": "...",
      "email": "john@school.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "institution_admin",
      "institution": { ... }
    }
  }
}
```

#### POST /auth/refresh
Refresh access token

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

#### POST /auth/logout
Logout user (invalidate refresh token)

#### POST /auth/forgot-password
Request password reset

#### POST /auth/reset-password
Reset password with token

#### POST /auth/verify-email
Verify email with token

---

## API Endpoints

### 📁 Institutions

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /institutions | List all institutions | Super Admin |
| GET | /institutions/:id | Get institution details | Admin+ |
| POST | /institutions | Create institution | Super Admin |
| PUT | /institutions/:id | Update institution | Admin |
| DELETE | /institutions/:id | Delete institution | Super Admin |
| GET | /institutions/:id/stats | Get institution statistics | Admin+ |
| PUT | /institutions/:id/settings | Update settings | Admin |
| PUT | /institutions/:id/branding | Update branding | Admin |

#### GET /institutions/:id
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Springfield High School",
    "code": "SHS001",
    "type": "secondary",
    "config": {
      "gradingSystem": "percentage",
      "enableAIFeatures": true
    },
    "subscription": {
      "plan": "professional",
      "status": "active"
    },
    "stats": {
      "totalStudents": 1250,
      "totalTeachers": 85,
      "totalClasses": 45
    }
  }
}
```

---

### 👥 Users

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /users | List users (filtered) | Coordinator+ |
| GET | /users/:id | Get user details | Self/Admin |
| POST | /users | Create user | Admin/Coordinator |
| PUT | /users/:id | Update user | Self/Admin |
| DELETE | /users/:id | Delete user | Admin |
| POST | /users/bulk-import | Bulk import users | Admin |
| GET | /users/me | Get current user | Any |
| PUT | /users/me | Update current user | Any |
| PUT | /users/me/password | Change password | Any |
| PUT | /users/me/avatar | Update avatar | Any |

#### GET /users
**Query Parameters:**
- `role`: Filter by role
- `class`: Filter by class (students)
- `section`: Filter by section
- `department`: Filter by department (teachers)
- `search`: Search by name/email
- `page`, `limit`: Pagination
- `sort`: Sort field
- `order`: asc/desc

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@school.com",
      "role": "teacher",
      "teacherProfile": {
        "employeeId": "T001",
        "department": { "_id": "...", "name": "Science" },
        "subjects": [{ "_id": "...", "name": "Physics" }]
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 85
  }
}
```

#### POST /users (Create Teacher)
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@school.com",
  "role": "teacher",
  "teacherProfile": {
    "department": "department_id",
    "subjects": ["subject_id_1", "subject_id_2"],
    "joiningDate": "2024-01-15"
  }
}
```

#### POST /users (Create Student)
```json
{
  "firstName": "Alex",
  "lastName": "Johnson",
  "email": "alex@student.school.com",
  "role": "student",
  "studentProfile": {
    "class": "class_id",
    "section": "section_id",
    "rollNumber": "101",
    "admissionDate": "2024-04-01",
    "parentId": "parent_user_id"
  }
}
```

---

### 🏢 Departments

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /departments | List departments | Teacher+ |
| GET | /departments/:id | Get department | Teacher+ |
| POST | /departments | Create department | Admin |
| PUT | /departments/:id | Update department | Admin/HOD |
| DELETE | /departments/:id | Delete department | Admin |
| GET | /departments/:id/teachers | Get department teachers | Coordinator+ |
| GET | /departments/:id/subjects | Get department subjects | Teacher+ |

---

### 📚 Classes

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /classes | List classes | Teacher+ |
| GET | /classes/:id | Get class details | Teacher+ |
| POST | /classes | Create class | Admin/Coordinator |
| PUT | /classes/:id | Update class | Admin/Coordinator |
| DELETE | /classes/:id | Delete class | Admin |
| GET | /classes/:id/students | Get class students | Teacher+ |
| GET | /classes/:id/subjects | Get class subjects | Teacher+ |
| GET | /classes/:id/timetable | Get class timetable | Any |
| GET | /classes/:id/attendance | Get class attendance | Teacher+ |

---

### 📖 Sections

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /sections | List sections | Teacher+ |
| GET | /sections/:id | Get section | Teacher+ |
| POST | /sections | Create section | Admin/Coordinator |
| PUT | /sections/:id | Update section | Admin/Coordinator |
| DELETE | /sections/:id | Delete section | Admin |
| GET | /sections/:id/students | Get section students | Teacher+ |

---

### 📕 Subjects

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /subjects | List subjects | Teacher+ |
| GET | /subjects/:id | Get subject | Teacher+ |
| POST | /subjects | Create subject | Admin/Coordinator |
| PUT | /subjects/:id | Update subject | Admin/Coordinator |
| DELETE | /subjects/:id | Delete subject | Admin |
| PUT | /subjects/:id/syllabus | Update syllabus | Teacher |
| GET | /subjects/:id/teachers | Get subject teachers | Coordinator+ |

---

### 📝 Homework

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /homework | List homework | Any |
| GET | /homework/:id | Get homework details | Any |
| POST | /homework | Create homework | Teacher |
| PUT | /homework/:id | Update homework | Teacher (owner) |
| DELETE | /homework/:id | Delete homework | Teacher (owner) |
| POST | /homework/:id/publish | Publish homework | Teacher |
| POST | /homework/:id/close | Close homework | Teacher |
| GET | /homework/:id/submissions | Get submissions | Teacher |

#### GET /homework
**Query Parameters (Student):**
- `status`: pending/submitted/graded
- `subject`: Filter by subject
- `dueDate`: Filter by due date range

**Response (Student View):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Chapter 5 Assignment",
      "subject": { "_id": "...", "name": "Mathematics" },
      "dueDate": "2024-01-20T23:59:59Z",
      "maxMarks": 100,
      "status": "published",
      "mySubmission": {
        "status": "submitted",
        "submittedAt": "2024-01-19T14:30:00Z",
        "marks": null
      }
    }
  ]
}
```

#### POST /homework
```json
{
  "title": "Chapter 5 - Quadratic Equations",
  "description": "Solve problems 1-20 from Exercise 5.3",
  "class": "class_id",
  "section": "section_id",
  "subject": "subject_id",
  "dueDate": "2024-01-20T23:59:59Z",
  "maxMarks": 100,
  "attachments": [
    {
      "name": "worksheet.pdf",
      "url": "https://..."
    }
  ],
  "aiAssisted": {
    "plagiarismCheck": true,
    "autoGrade": false
  }
}
```

---

### 📤 Submissions

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /submissions | List my submissions | Student |
| GET | /submissions/:id | Get submission | Student/Teacher |
| POST | /submissions | Submit homework | Student |
| PUT | /submissions/:id | Update submission | Student |
| POST | /submissions/:id/grade | Grade submission | Teacher |
| POST | /submissions/:id/return | Return for revision | Teacher |
| GET | /submissions/:id/ai-analysis | Get AI analysis | Teacher |

#### POST /submissions
```json
{
  "homework": "homework_id",
  "content": "My solution to the problems...",
  "attachments": [
    {
      "name": "solution.pdf",
      "url": "https://..."
    }
  ]
}
```

#### POST /submissions/:id/grade
```json
{
  "marks": 85,
  "feedback": {
    "text": "Good work! Minor errors in Q15 and Q18."
  }
}
```

---

### ✅ Attendance

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /attendance | Get attendance records | Teacher+ |
| POST | /attendance | Mark attendance | Teacher |
| PUT | /attendance/:id | Update attendance | Teacher |
| GET | /attendance/student/:id | Get student attendance | Self/Teacher/Parent |
| GET | /attendance/report | Get attendance report | Coordinator+ |

#### POST /attendance
```json
{
  "class": "class_id",
  "section": "section_id",
  "date": "2024-01-15",
  "records": [
    { "student": "student_id_1", "status": "present" },
    { "student": "student_id_2", "status": "absent" },
    { "student": "student_id_3", "status": "late", "remarks": "10 mins late" }
  ]
}
```

---

### 📊 Exams & Grades

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /exams | List exams | Any |
| GET | /exams/:id | Get exam details | Any |
| POST | /exams | Create exam | Admin/Coordinator |
| PUT | /exams/:id | Update exam | Admin/Coordinator |
| DELETE | /exams/:id | Delete exam | Admin |
| POST | /exams/:id/schedule | Add/Update schedule | Coordinator |
| POST | /exams/:id/publish-results | Publish results | Admin |
| GET | /grades | Get grades | Student/Teacher |
| POST | /grades | Enter grades | Teacher |
| PUT | /grades/:id | Update grades | Teacher |
| GET | /grades/report-card/:studentId | Generate report card | Any |

---

### 📅 Timetables

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /timetables | Get timetables | Any |
| GET | /timetables/:id | Get timetable | Any |
| POST | /timetables | Create timetable | Admin/Coordinator |
| PUT | /timetables/:id | Update timetable | Admin/Coordinator |
| DELETE | /timetables/:id | Delete timetable | Admin |
| POST | /timetables/ai-generate | AI generate timetable | Admin |
| GET | /timetables/teacher/:id | Get teacher timetable | Teacher |

---

### 📢 Announcements

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /announcements | List announcements | Any |
| GET | /announcements/:id | Get announcement | Any |
| POST | /announcements | Create announcement | Coordinator+ |
| PUT | /announcements/:id | Update announcement | Owner |
| DELETE | /announcements/:id | Delete announcement | Owner/Admin |
| POST | /announcements/:id/read | Mark as read | Any |

---

### 🔔 Notifications

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /notifications | Get my notifications | Any |
| PUT | /notifications/:id/read | Mark as read | Any |
| PUT | /notifications/read-all | Mark all as read | Any |
| DELETE | /notifications/:id | Delete notification | Any |
| GET | /notifications/unread-count | Get unread count | Any |

---

### 📁 Resources (Study Materials)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /resources | List resources | Any |
| GET | /resources/:id | Get resource | Any |
| POST | /resources | Upload resource | Teacher |
| PUT | /resources/:id | Update resource | Owner |
| DELETE | /resources/:id | Delete resource | Owner/Admin |
| GET | /resources/:id/download | Download resource | Any |

---

### 📅 Calendar

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /calendar | Get calendar events | Any |
| GET | /calendar/month/:year/:month | Get month events | Any |
| GET | /calendar/my-attendance | Get my attendance calendar | Student/Teacher |

---

### 🏖️ Holidays

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /holidays | List holidays | Any |
| GET | /holidays/:id | Get holiday details | Any |
| POST | /holidays | Create holiday | Admin |
| PUT | /holidays/:id | Update holiday | Admin |
| DELETE | /holidays/:id | Delete holiday | Admin |
| GET | /holidays/upcoming | Get upcoming holidays | Any |

#### POST /holidays
```json
{
  "name": "Diwali",
  "description": "Festival of Lights",
  "startDate": "2025-10-20",
  "endDate": "2025-10-24",
  "type": "public",
  "applicableTo": {
    "all": true
  }
}
```

---

### 📝 Leave Requests

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /leaves | Get leave requests | Any |
| GET | /leaves/:id | Get leave details | Self/Admin |
| POST | /leaves | Apply for leave | Student/Teacher |
| PUT | /leaves/:id | Update leave request | Self |
| DELETE | /leaves/:id | Cancel leave request | Self |
| POST | /leaves/:id/approve | Approve leave | Admin/Coordinator |
| POST | /leaves/:id/reject | Reject leave | Admin/Coordinator |
| GET | /leaves/pending | Get pending approvals | Admin/Coordinator |
| GET | /leaves/my | Get my leave requests | Any |

#### POST /leaves
```json
{
  "leaveType": "sick",
  "reason": "Not feeling well",
  "startDate": "2025-01-20",
  "endDate": "2025-01-21",
  "totalDays": 2,
  "attachments": []
}
```

#### POST /leaves/:id/reject
```json
{
  "rejectionReason": "Insufficient leave balance"
}
```

---

### 📄 Question Papers (AI Generated)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /question-papers | List question papers | Teacher |
| GET | /question-papers/:id | Get paper details | Teacher |
| POST | /question-papers/generate-from-topics | Generate from topics | Teacher |
| POST | /question-papers/upload-previous | Upload previous paper | Teacher |
| POST | /question-papers/:id/extract-text | Extract text from PDF | Teacher |
| POST | /question-papers/:id/generate | Generate new paper | Teacher |
| PUT | /question-papers/:id | Update paper | Teacher |
| DELETE | /question-papers/:id | Delete paper | Teacher |
| POST | /question-papers/:id/publish | Publish paper | Teacher |
| GET | /question-papers/:id/answer-key | Get answer key | Teacher |

#### POST /question-papers/generate-from-topics
```json
{
  "subject": "subject_id",
  "class": "class_id",
  "title": "Mid-Term Physics 2025",
  "topics": [
    { "name": "Newton's Laws", "weightage": 30 },
    { "name": "Work & Energy", "weightage": 25 },
    { "name": "Gravitation", "weightage": 25 },
    { "name": "Sound", "weightage": 20 }
  ],
  "aiConfig": {
    "difficulty": "medium",
    "questionTypes": [
      { "type": "mcq", "count": 20, "marksPerQuestion": 1 },
      { "type": "short_answer", "count": 10, "marksPerQuestion": 3 },
      { "type": "long_answer", "count": 5, "marksPerQuestion": 10 }
    ],
    "totalMarks": 100,
    "duration": 180
  }
}
```

#### POST /question-papers/upload-previous
```json
{
  "file": "<PDF file>",
  "subject": "subject_id",
  "class": "class_id",
  "year": "2024"
}
```

**Response after extraction:**
```json
{
  "success": true,
  "data": {
    "paperId": "...",
    "extractedQuestions": 35,
    "sections": [...],
    "confidence": 0.92,
    "status": "ready_to_generate"
  }
}
```

---

### 🤖 AI Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /ai/analyze-submission | Analyze submission | Teacher |
| POST | /ai/generate-questions | Generate questions | Teacher |
| POST | /ai/plagiarism-check | Check plagiarism | Teacher |
| GET | /ai/student-insights/:id | Get student insights | Teacher/Coordinator |
| GET | /ai/class-analytics/:id | Get class analytics | Coordinator+ |
| POST | /ai/generate-timetable | Generate timetable | Admin |
| GET | /ai/at-risk-students | Get at-risk students | Coordinator+ |
| POST | /ai/chatbot | AI chatbot query | Any |
| POST | /ai/extract-pdf-text | Extract text from PDF | Teacher |

#### POST /ai/analyze-submission
```json
{
  "submissionId": "submission_id",
  "options": {
    "plagiarismCheck": true,
    "grammarCheck": true,
    "suggestGrade": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plagiarismScore": 12,
    "grammarIssues": [...],
    "suggestedGrade": "B+",
    "strengths": ["Good understanding of concepts", "Well-structured"],
    "improvements": ["Needs more examples", "Citation formatting"],
    "confidence": 0.85
  }
}
```

---

### 💰 Fee Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /fees/structures | List fee structures | Admin |
| POST | /fees/structures | Create fee structure | Admin |
| PUT | /fees/structures/:id | Update fee structure | Admin |
| GET | /fees/student/:id | Get student fees | Student/Parent/Admin |
| GET | /fees/invoices | List invoices | Admin |
| GET | /fees/invoices/:id | Get invoice details | Student/Parent/Admin |
| POST | /fees/invoices/generate | Generate invoices | Admin |
| POST | /fees/pay | Initiate payment | Parent |
| POST | /fees/pay/verify | Verify payment | System |
| GET | /fees/receipts/:id | Get receipt | Student/Parent |
| GET | /fees/reports/collection | Fee collection report | Admin |
| GET | /fees/reports/defaulters | Defaulters list | Admin |

#### POST /fees/pay
```json
{
  "invoiceId": "invoice_id",
  "amount": 15000,
  "paymentMethod": "razorpay"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz123",
    "razorpayKey": "rzp_live_xxx",
    "amount": 1500000,
    "currency": "INR"
  }
}
```

---

### 🚌 Transport Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /transport/routes | List routes | Any |
| GET | /transport/routes/:id | Get route details | Any |
| POST | /transport/routes | Create route | Admin |
| PUT | /transport/routes/:id | Update route | Admin |
| DELETE | /transport/routes/:id | Delete route | Admin |
| POST | /transport/routes/:id/students | Assign students | Admin |
| DELETE | /transport/routes/:id/students/:studentId | Remove student | Admin |
| GET | /transport/my-route | Get my route (student) | Student/Parent |
| GET | /transport/tracking/:routeId | Get live location | Parent |

---

### 📚 Library Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /library/books | List books | Any |
| GET | /library/books/:id | Get book details | Any |
| POST | /library/books | Add book | Librarian |
| PUT | /library/books/:id | Update book | Librarian |
| DELETE | /library/books/:id | Remove book | Librarian |
| POST | /library/issue | Issue book | Librarian |
| POST | /library/return/:transactionId | Return book | Librarian |
| POST | /library/renew/:transactionId | Renew book | Student/Librarian |
| GET | /library/my-books | Get my borrowed books | Student/Teacher |
| GET | /library/overdue | Get overdue books | Librarian |
| POST | /library/fine/:transactionId/pay | Pay fine | Student |
| GET | /library/reports/inventory | Inventory report | Librarian |

#### POST /library/issue
```json
{
  "bookId": "book_id",
  "memberId": "user_id",
  "dueDate": "2025-02-15"
}
```

---

### 🏠 Hostel Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /hostel/rooms | List rooms | Admin |
| GET | /hostel/rooms/:id | Get room details | Admin |
| POST | /hostel/rooms | Add room | Admin |
| PUT | /hostel/rooms/:id | Update room | Admin |
| POST | /hostel/rooms/:id/allocate | Allocate student | Admin |
| DELETE | /hostel/rooms/:id/vacate/:studentId | Vacate student | Admin |
| GET | /hostel/my-room | Get my room | Student |
| GET | /hostel/mess/menu | Get mess menu | Any |
| POST | /hostel/mess/menu | Update mess menu | Admin |
| POST | /hostel/visitors | Log visitor entry | Warden |
| GET | /hostel/visitors | Get visitor log | Admin/Warden |
| POST | /hostel/complaints | Submit complaint | Student |
| GET | /hostel/complaints | List complaints | Admin/Warden |
| PUT | /hostel/complaints/:id | Update complaint status | Admin/Warden |

---

### 💼 Salary & Payroll Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /salary/structures | List salary structures | Admin |
| POST | /salary/structures | Create salary structure | Admin |
| PUT | /salary/structures/:id | Update salary structure | Admin |
| GET | /salary/employees | List employee salaries | Admin |
| GET | /salary/employees/:id | Get employee salary | Self/Admin |
| POST | /salary/employees | Assign salary to employee | Admin |
| PUT | /salary/employees/:id | Update employee salary | Admin |
| GET | /payroll | List payroll records | Admin |
| POST | /payroll/generate | Generate monthly payroll | Admin |
| GET | /payroll/:id | Get payroll details | Self/Admin |
| POST | /payroll/:id/approve | Approve payroll | Admin |
| POST | /payroll/:id/process | Process payment | Admin |
| GET | /payroll/my-payslips | Get my payslips | Employee |
| GET | /payroll/:id/payslip | Download payslip | Self/Admin |
| GET | /payroll/reports/monthly | Monthly salary report | Admin |
| GET | /payroll/reports/tax | Tax deduction report | Admin |

#### POST /payroll/generate
```json
{
  "month": 1,
  "year": 2025,
  "employeeIds": []  // Empty = all employees
}
```

---

### 👨‍👩‍👧 Parent Portal

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /parent/children | Get my children | Parent |
| GET | /parent/child/:id/progress | Get child progress | Parent |
| GET | /parent/child/:id/attendance | Get child attendance | Parent |
| GET | /parent/child/:id/homework | Get child homework | Parent |
| GET | /parent/child/:id/fees | Get child fees | Parent |
| GET | /parent/child/:id/report-card | Get report card | Parent |
| GET | /parent/ptm/slots | Get available PTM slots | Parent |
| POST | /parent/ptm/book | Book PTM slot | Parent |
| GET | /parent/ptm/my-bookings | Get my PTM bookings | Parent |
| DELETE | /parent/ptm/:id/cancel | Cancel PTM booking | Parent |

---

### 📝 Admission Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /admissions | List applications | Admin |
| GET | /admissions/:id | Get application details | Admin/Applicant |
| POST | /admissions/apply | Submit application | Public |
| PUT | /admissions/:id | Update application | Applicant |
| POST | /admissions/:id/documents | Upload documents | Applicant |
| PUT | /admissions/:id/verify-document | Verify document | Admin |
| PUT | /admissions/:id/status | Update status | Admin |
| POST | /admissions/:id/schedule-test | Schedule entrance test | Admin |
| PUT | /admissions/:id/test-result | Update test result | Admin |
| GET | /admissions/merit-list | Generate merit list | Admin |
| POST | /admissions/:id/approve | Approve admission | Admin |
| POST | /admissions/:id/reject | Reject application | Admin |
| POST | /admissions/:id/enroll | Enroll student | Admin |
| GET | /admissions/track/:applicationNumber | Track application status | Public |
| GET | /admissions/reports/summary | Admission summary report | Admin |

#### POST /admissions/apply
```json
{
  "applicant": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "2010-05-15",
    "gender": "male",
    "email": "parent@email.com",
    "phone": "+91-9876543210"
  },
  "guardian": {
    "fatherName": "James Doe",
    "fatherPhone": "+91-9876543211",
    "motherName": "Jane Doe"
  },
  "applyingFor": {
    "class": "class_id"
  },
  "previousEducation": {
    "schoolName": "ABC School",
    "board": "CBSE",
    "percentage": 85
  }
}
```

---

### 🎉 Events Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /events | List events | Any |
| GET | /events/:id | Get event details | Any |
| POST | /events | Create event | Coordinator+ |
| PUT | /events/:id | Update event | Owner/Admin |
| DELETE | /events/:id | Delete event | Admin |
| POST | /events/:id/publish | Publish event | Owner |
| POST | /events/:id/cancel | Cancel event | Owner/Admin |
| POST | /events/:id/register | Register for event | Any |
| DELETE | /events/:id/register | Cancel registration | Self |
| GET | /events/:id/registrations | Get registrations | Organizer |
| POST | /events/:id/check-in/:userId | Check-in participant | Organizer |
| POST | /events/:id/scores | Submit competition scores | Judge |
| GET | /events/:id/results | Get competition results | Any |
| POST | /events/:id/gallery | Upload photos | Organizer |
| POST | /events/:id/certificates | Generate certificates | Organizer |
| GET | /events/:id/certificate/:participantId | Download certificate | Participant |
| GET | /events/my-registrations | Get my registered events | Any |
| GET | /events/calendar | Get events for calendar | Any |

#### POST /events
```json
{
  "title": "Annual Sports Day 2025",
  "description": "Annual sports competition",
  "eventType": "sports",
  "startDate": "2025-02-15",
  "endDate": "2025-02-16",
  "venue": "Main Ground",
  "requiresRegistration": true,
  "registrationDeadline": "2025-02-10",
  "targetAudience": {
    "all": true
  },
  "competition": {
    "isCompetition": true,
    "categories": [
      { "name": "100m Race", "maxParticipants": 20 },
      { "name": "Long Jump", "maxParticipants": 15 }
    ]
  }
}
```

---

### 📈 Reports & Analytics

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /reports/dashboard | Dashboard stats | Any |
| GET | /reports/attendance | Attendance report | Coordinator+ |
| GET | /reports/academic | Academic report | Coordinator+ |
| GET | /reports/student/:id | Student report | Teacher/Parent |
| GET | /reports/class/:id | Class report | Teacher+ |
| GET | /reports/fees | Fee collection report | Admin |
| GET | /reports/salary | Salary report | Admin |
| GET | /reports/library | Library report | Librarian+ |
| GET | /reports/transport | Transport report | Admin |
| GET | /reports/export | Export report (PDF/Excel) | Coordinator+ |

---

### 📤 File Upload

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /upload/image | Upload image | Any |
| POST | /upload/document | Upload document | Any |
| POST | /upload/bulk | Bulk upload | Any |
| DELETE | /upload/:id | Delete file | Owner |

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

### Error Response Example
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

## Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 1 minute |
| AI Endpoints | 20 requests | 1 minute |
| File Upload | 10 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Webhooks (Future)

### Available Events
- `user.created`
- `homework.assigned`
- `submission.graded`
- `attendance.marked`
- `announcement.published`

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Project: Meridian EMS*
