# Meridian EMS - Database Schema (MongoDB)

## 📋 Table of Contents
1. [Database Overview](#database-overview)
2. [Collections](#collections)
3. [Schema Definitions](#schema-definitions)
4. [Relationships](#relationships)
5. [Indexes](#indexes)

---

## Database Overview

### Database: `meridian_ems`

### Design Principles
- **Multi-tenancy**: Institution-based data isolation
- **Soft Deletes**: `isDeleted` flag instead of hard deletes
- **Audit Trail**: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- **Flexible Schema**: Support for different institution types

---

## Collections

| Collection | Description |
|------------|-------------|
| `institutions` | Schools, Colleges, Universities |
| `users` | All users (super_admin, admin, institution_admin, teachers, students, parents, staff) |
| `departments` | Departments within institutions |
| `classes` | Classes/Grades/Semesters |
| `sections` | Sections within classes |
| `subjects` | Subjects/Courses |
| `homework` | Assignments and homework |
| `submissions` | Student homework submissions |
| `attendance` | Daily attendance records |
| `exams` | Examination schedules |
| `grades` | Student grades/marks |
| `timetables` | Class schedules |
| `announcements` | Institution announcements |
| `notifications` | User notifications |
| `messages` | Direct messages |
| `resources` | Study materials |
| `subscriptions` | Institution subscription plans |
| `ai_analytics` | AI-generated insights |
| `activity_logs` | User activity audit trail |
| `files` | File storage (GridFS metadata) |
| `holidays` | Institution holidays |
| `leave_requests` | Leave/absence requests |
| `question_papers` | AI-generated question papers |
| `fee_structures` | Fee types and amounts |
| `fee_payments` | Fee payment records |
| `transport_routes` | Bus routes and stops |
| `library_books` | Book catalog |
| `library_transactions` | Book issue/return records |
| `hostel_rooms` | Hostel room inventory |
| `hostel_mess` | Mess menu and meal plans |
| `salary_structures` | Employee salary components |
| `employee_salaries` | Individual salary records |
| `payroll` | Monthly payroll processing |
| `admission_applications` | Online admission applications |
| `events` | Institution events |
| `event_registrations` | Event participant registrations |

---

## Schema Definitions

### 1. Institution Schema

```javascript
// Collection: institutions
{
  _id: ObjectId,
  
  // Basic Info
  name: String,                    // "Springfield High School"
  code: String,                    // "SHS001" (unique)
  type: String,                    // "primary" | "middle" | "secondary" | "college" | "university" | "coaching"
  
  // Contact
  email: String,
  phone: String,
  website: String,
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Branding
  logo: String,                    // URL to logo
  theme: {
    primaryColor: String,          // "#3B82F6"
    secondaryColor: String
  },
  
  // Configuration
  config: {
    academicYearStart: Number,     // Month (1-12)
    gradingSystem: String,         // "percentage" | "gpa" | "cgpa" | "grades"
    attendanceType: String,        // "daily" | "subject-wise"
    enableParentPortal: Boolean,
    enableAIFeatures: Boolean,
    maxStudents: Number,
    maxTeachers: Number
  },
  
  // Academic Structure
  academicYears: [{
    year: String,                  // "2024-2025"
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean
  }],
  
  // Subscription
  subscription: {
    plan: String,                  // "trial" | "basic" | "professional" | "enterprise"
    status: String,                // "active" | "expired" | "cancelled"
    startDate: Date,
    endDate: Date,
    features: [String]
  },
  
  // Meta
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId,             // ref: users
  updatedBy: ObjectId
}

// Indexes
// { code: 1 } - unique
// { "subscription.status": 1 }
// { type: 1 }
```

### 2. User Schema

```javascript
// Collection: users
{
  _id: ObjectId,
  
  // Authentication
  email: String,                   // unique
  password: String,                // hashed
  phoneNumber: String,
  
  // Password Management
  isFirstLogin: Boolean,           // true = must change password on first login
  mustChangePassword: Boolean,     // force password change
  passwordHistory: [String],       // last 5 hashed passwords (prevent reuse)
  passwordChangedAt: Date,
  
  // Account Creation
  createdBy: ObjectId,             // ref: users (admin who created this account)
  accountCreationType: String,     // "manual" | "bulk_import" | "self_register"
  
  // Basic Info
  firstName: String,
  lastName: String,
  displayName: String,
  avatar: String,                  // URL
  gender: String,                  // "male" | "female" | "other"
  dateOfBirth: Date,
  
  // Role & Institution
  role: String,                    // "super_admin" | "admin" | "institution_admin" | "coordinator" | "teacher" | "student" | "parent" | "staff"
  institution: ObjectId,           // ref: institutions (null for super_admin and admin)
  
  // Role-specific data (embedded for performance)
  teacherProfile: {
    employeeId: String,
    department: ObjectId,          // ref: departments
    subjects: [ObjectId],          // ref: subjects
    qualifications: [String],
    joiningDate: Date,
    specializations: [String]
  },
  
  studentProfile: {
    enrollmentNumber: String,
    class: ObjectId,               // ref: classes
    section: ObjectId,             // ref: sections
    rollNumber: String,
    admissionDate: Date,
    parentId: ObjectId,            // ref: users (parent)
    bloodGroup: String,
    emergencyContact: {
      name: String,
      relation: String,
      phone: String
    }
  },
  
  parentProfile: {
    children: [ObjectId],          // ref: users (students)
    occupation: String,
    relationship: String           // "father" | "mother" | "guardian"
  },
  
  coordinatorProfile: {
    department: ObjectId,          // ref: departments
    managedClasses: [ObjectId],    // ref: classes
    managedTeachers: [ObjectId]    // ref: users
  },
  
  // Permissions (override role defaults)
  permissions: {
    canManageTeachers: Boolean,
    canManageStudents: Boolean,
    canViewReports: Boolean,
    canUseAI: Boolean,
    customPermissions: [String]
  },
  
  // Settings
  settings: {
    language: String,              // "en" | "hi" | "es" etc.
    timezone: String,
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean
    },
    theme: String                  // "light" | "dark" | "system"
  },
  
  // Status
  isActive: Boolean,
  isEmailVerified: Boolean,
  isPhoneVerified: Boolean,
  lastLogin: Date,
  
  // Auth Tokens
  refreshTokens: [{
    token: String,
    device: String,
    createdAt: Date,
    expiresAt: Date
  }],
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Meta
  status: String,                  // "active" | "inactive" | "suspended" | "deleted"
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  updatedBy: ObjectId
}

// Indexes
// { email: 1 } - unique
// { institution: 1, role: 1 }
// { "studentProfile.class": 1 }
// { "studentProfile.enrollmentNumber": 1 }
// { "teacherProfile.employeeId": 1 }
```

### 3. Department Schema

```javascript
// Collection: departments
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  name: String,                    // "Science Department"
  code: String,                    // "SCI"
  description: String,
  head: ObjectId,                  // ref: users (coordinator/teacher)
  
  // Meta
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, code: 1 } - unique compound
```

### 4. Class Schema

```javascript
// Collection: classes
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  
  name: String,                    // "Grade 10" | "Semester 3"
  code: String,                    // "G10" | "SEM3"
  type: String,                    // "grade" | "semester" | "year" | "batch"
  
  // For schools
  grade: Number,                   // 1-12
  
  // For colleges
  department: ObjectId,            // ref: departments
  year: Number,                    // 1, 2, 3, 4
  semester: Number,                // 1-8
  
  academicYear: String,            // "2024-2025"
  
  // Class teacher/coordinator
  classTeacher: ObjectId,          // ref: users
  
  // Configuration
  maxStudents: Number,
  subjects: [ObjectId],            // ref: subjects
  
  // Meta
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, academicYear: 1 }
// { institution: 1, code: 1, academicYear: 1 } - unique
```

### 5. Section Schema

```javascript
// Collection: sections
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  class: ObjectId,                 // ref: classes
  
  name: String,                    // "A" | "B" | "Morning Batch"
  code: String,
  
  classTeacher: ObjectId,          // ref: users
  maxStudents: Number,
  room: String,                    // "Room 101"
  
  // Meta
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { class: 1 }
// { institution: 1, class: 1, name: 1 } - unique
```

### 6. Subject Schema

```javascript
// Collection: subjects
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  department: ObjectId,            // ref: departments (optional)
  
  name: String,                    // "Mathematics"
  code: String,                    // "MATH101"
  description: String,
  
  type: String,                    // "theory" | "practical" | "both"
  credits: Number,                 // For colleges
  
  // Applicable classes
  classes: [ObjectId],             // ref: classes
  
  // Syllabus
  syllabus: [{
    unit: Number,
    title: String,
    topics: [String],
    hours: Number
  }],
  
  // Meta
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, code: 1 } - unique
// { classes: 1 }
```

### 7. Homework Schema

```javascript
// Collection: homework
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  class: ObjectId,                 // ref: classes
  section: ObjectId,               // ref: sections (optional, null = all sections)
  subject: ObjectId,               // ref: subjects
  
  title: String,
  description: String,             // Rich text / Markdown
  instructions: String,
  
  type: String,                    // "assignment" | "project" | "quiz" | "practice"
  
  // Files
  attachments: [{
    name: String,
    url: String,
    type: String,                  // "pdf" | "doc" | "image" | "video"
    size: Number
  }],
  
  // Dates
  assignedDate: Date,
  dueDate: Date,
  
  // Grading
  maxMarks: Number,
  passingMarks: Number,
  isGraded: Boolean,
  
  // AI Features
  aiAssisted: {
    plagiarismCheck: Boolean,
    autoGrade: Boolean,
    difficultyLevel: String        // "easy" | "medium" | "hard"
  },
  
  // Configuration
  allowLateSubmission: Boolean,
  latePenaltyPercentage: Number,
  
  // Assigned by
  assignedBy: ObjectId,            // ref: users (teacher)
  
  // Status System
  status: String,                  // "draft" | "published" | "closed" | "deleted"
  publishedAt: Date,
  closedAt: Date,
  
  // Meta
  isDeleted: Boolean,              // soft delete flag
  deletedAt: Date,
  deletedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, class: 1, dueDate: -1 }
// { assignedBy: 1 }
// { status: 1, dueDate: 1 }
// { institution: 1, status: 1 }
```

### 8. Submission Schema

```javascript
// Collection: submissions
{
  _id: ObjectId,
  
  homework: ObjectId,              // ref: homework
  student: ObjectId,               // ref: users
  
  // Submission content
  content: String,                 // Text response
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: Date
  }],
  
  // Timestamps
  submittedAt: Date,
  lastModifiedAt: Date,
  isLate: Boolean,
  
  // Grading
  status: String,                  // "draft" | "submitted" | "graded" | "returned"
  marks: Number,
  maxMarks: Number,
  percentage: Number,
  grade: String,
  
  // Feedback
  feedback: {
    text: String,
    attachments: [{
      name: String,
      url: String
    }],
    givenBy: ObjectId,             // ref: users (teacher)
    givenAt: Date
  },
  
  // AI Analysis
  aiAnalysis: {
    plagiarismScore: Number,       // 0-100
    similarSources: [{
      source: String,
      similarity: Number
    }],
    suggestedGrade: String,
    strengths: [String],
    improvements: [String],
    analyzedAt: Date
  },
  
  // Graded by
  gradedBy: ObjectId,              // ref: users
  gradedAt: Date,
  
  // Meta
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { homework: 1, student: 1 } - unique
// { student: 1, submittedAt: -1 }
// { status: 1 }
```

### 9. Attendance Schema

```javascript
// Collection: attendance
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  class: ObjectId,                 // ref: classes
  section: ObjectId,               // ref: sections
  subject: ObjectId,               // ref: subjects (for subject-wise attendance)
  
  date: Date,
  
  // Attendance records
  records: [{
    student: ObjectId,             // ref: users
    status: String,                // "present" | "absent" | "late" | "excused"
    checkInTime: Date,
    checkOutTime: Date,
    remarks: String
  }],
  
  // Summary
  summary: {
    total: Number,
    present: Number,
    absent: Number,
    late: Number,
    excused: Number
  },
  
  // Recorded by
  markedBy: ObjectId,              // ref: users (teacher)
  
  // Meta
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, class: 1, section: 1, date: 1 } - unique compound
// { "records.student": 1, date: 1 }
```

### 10. Exam Schema

```javascript
// Collection: exams
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  
  name: String,                    // "Mid-Term Examination"
  type: String,                    // "unit_test" | "mid_term" | "final" | "practical"
  
  academicYear: String,
  term: String,                    // "Term 1" | "Semester 1"
  
  // Date range
  startDate: Date,
  endDate: Date,
  
  // Applicable classes
  classes: [ObjectId],             // ref: classes
  
  // Schedule
  schedule: [{
    date: Date,
    subject: ObjectId,             // ref: subjects
    class: ObjectId,               // ref: classes
    startTime: String,             // "09:00"
    endTime: String,               // "12:00"
    maxMarks: Number,
    passingMarks: Number,
    room: String
  }],
  
  // Configuration
  config: {
    showResultsToStudents: Boolean,
    showRankings: Boolean,
    gradeScale: [{
      grade: String,               // "A+"
      minPercentage: Number,       // 90
      maxPercentage: Number,       // 100
      gradePoints: Number          // 10
    }]
  },
  
  // Status System
  status: String,                  // "draft" | "scheduled" | "ongoing" | "completed" | "results_published" | "deleted"
  publishedAt: Date,
  
  // Meta
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}

// Indexes
// { institution: 1, academicYear: 1 }
// { status: 1, startDate: 1 }
```

### 11. Grade Schema

```javascript
// Collection: grades
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  exam: ObjectId,                  // ref: exams
  student: ObjectId,               // ref: users
  subject: ObjectId,               // ref: subjects
  class: ObjectId,                 // ref: classes
  
  // Marks
  marksObtained: Number,
  maxMarks: Number,
  percentage: Number,
  grade: String,
  gradePoints: Number,
  
  // Breakdown (for practical + theory)
  breakdown: {
    theory: {
      marks: Number,
      maxMarks: Number
    },
    practical: {
      marks: Number,
      maxMarks: Number
    },
    internal: {
      marks: Number,
      maxMarks: Number
    }
  },
  
  // Rank
  classRank: Number,
  sectionRank: Number,
  
  // Remarks
  remarks: String,
  
  // Graded by
  gradedBy: ObjectId,              // ref: users
  gradedAt: Date,
  
  // Meta
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { exam: 1, student: 1, subject: 1 } - unique compound
// { student: 1, exam: 1 }
// { institution: 1, exam: 1, subject: 1, percentage: -1 } - for ranking
```

### 12. Timetable Schema

```javascript
// Collection: timetables
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  class: ObjectId,                 // ref: classes
  section: ObjectId,               // ref: sections
  
  academicYear: String,
  effectiveFrom: Date,
  effectiveTo: Date,
  
  // Weekly schedule
  schedule: [{
    day: String,                   // "monday" | "tuesday" etc.
    periods: [{
      periodNumber: Number,
      startTime: String,           // "09:00"
      endTime: String,             // "09:45"
      subject: ObjectId,           // ref: subjects
      teacher: ObjectId,           // ref: users
      room: String,
      type: String                 // "regular" | "lab" | "break" | "assembly"
    }]
  }],
  
  // Configuration
  config: {
    periodDuration: Number,        // minutes
    breakDuration: Number,
    lunchDuration: Number,
    schoolStartTime: String,
    schoolEndTime: String
  },
  
  // Status
  isActive: Boolean,
  
  // Meta
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}

// Indexes
// { institution: 1, class: 1, section: 1, isActive: 1 }
```

### 13. Announcement Schema

```javascript
// Collection: announcements
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  
  title: String,
  content: String,                 // Rich text
  
  // Target audience
  audience: {
    type: String,                  // "all" | "teachers" | "students" | "parents" | "specific"
    classes: [ObjectId],           // ref: classes (if specific)
    sections: [ObjectId],          // ref: sections (if specific)
    roles: [String]                // specific roles
  },
  
  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  
  // Priority
  priority: String,                // "low" | "normal" | "high" | "urgent"
  isPinned: Boolean,
  
  // Scheduling
  publishAt: Date,
  expiresAt: Date,
  
  // Posted by
  postedBy: ObjectId,              // ref: users
  
  // Status System
  status: String,                  // "draft" | "scheduled" | "published" | "archived" | "deleted"
  publishedAt: Date,
  
  // Read tracking
  readBy: [{
    user: ObjectId,
    readAt: Date
  }],
  
  // Meta
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, status: 1, publishAt: -1 }
// { "audience.classes": 1 }
```

### 14. Notification Schema

```javascript
// Collection: notifications
{
  _id: ObjectId,
  
  user: ObjectId,                  // ref: users
  
  type: String,                    // "homework" | "grade" | "announcement" | "message" | "reminder" | "system"
  
  title: String,
  message: String,
  
  // Reference to related entity
  reference: {
    type: String,                  // "homework" | "exam" | "announcement" etc.
    id: ObjectId
  },
  
  // Action
  actionUrl: String,               // Deep link
  
  // Status
  isRead: Boolean,
  readAt: Date,
  
  // Delivery
  channels: {
    push: { sent: Boolean, sentAt: Date },
    email: { sent: Boolean, sentAt: Date },
    sms: { sent: Boolean, sentAt: Date }
  },
  
  // Meta
  createdAt: Date,
  expiresAt: Date
}

// Indexes
// { user: 1, isRead: 1, createdAt: -1 }
// { user: 1, type: 1 }
```

### 15. AI Analytics Schema

```javascript
// Collection: ai_analytics
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  
  type: String,                    // "student_performance" | "attendance_pattern" | "at_risk" | "class_analytics"
  
  // Target
  target: {
    type: String,                  // "student" | "class" | "subject" | "teacher"
    id: ObjectId
  },
  
  // Analysis period
  period: {
    from: Date,
    to: Date
  },
  
  // Insights
  insights: {
    summary: String,
    metrics: [{
      name: String,
      value: Mixed,
      trend: String,               // "up" | "down" | "stable"
      change: Number               // percentage
    }],
    predictions: [{
      type: String,
      probability: Number,
      description: String
    }],
    recommendations: [{
      priority: String,
      action: String,
      reason: String
    }]
  },
  
  // Risk assessment (for students)
  riskAssessment: {
    level: String,                 // "low" | "medium" | "high"
    factors: [String],
    interventions: [String]
  },
  
  // Meta
  generatedAt: Date,
  modelVersion: String,
  confidence: Number               // 0-1
}

// Indexes
// { institution: 1, type: 1, generatedAt: -1 }
// { "target.type": 1, "target.id": 1 }
```

### 16. File Schema (MongoDB GridFS)

```javascript
// Collection: files (GridFS metadata + custom fields)
// Actual file data stored in files.chunks
{
  _id: ObjectId,
  
  // GridFS standard fields
  length: Number,                  // file size in bytes
  chunkSize: Number,               // chunk size (default 255KB)
  uploadDate: Date,
  filename: String,                // original filename
  
  // Custom metadata
  metadata: {
    institution: ObjectId,         // ref: institutions
    uploadedBy: ObjectId,          // ref: users
    
    // File info
    originalName: String,
    mimeType: String,              // "image/jpeg" | "application/pdf" etc.
    category: String,              // "avatar" | "homework" | "resource" | "certificate" | "question_paper"
    
    // Reference to parent entity
    relatedTo: {
      type: String,                // "homework" | "submission" | "user" | "announcement" | "resource"
      id: ObjectId
    },
    
    // For images
    dimensions: {
      width: Number,
      height: Number
    },
    
    // Status
    isPublic: Boolean,             // publicly accessible URL
    isDeleted: Boolean,
    deletedAt: Date
  }
}

// Indexes
// { "metadata.institution": 1, "metadata.category": 1 }
// { "metadata.relatedTo.type": 1, "metadata.relatedTo.id": 1 }
// { "metadata.uploadedBy": 1 }
```

### 17. Holiday Schema

```javascript
// Collection: holidays
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  
  name: String,                    // "Diwali" | "Christmas" | "Summer Vacation"
  description: String,
  
  // Date range
  startDate: Date,
  endDate: Date,                   // same as startDate for single-day holidays
  
  // Type
  type: String,                    // "public" | "institution" | "optional"
  
  // Applicable to
  applicableTo: {
    all: Boolean,                  // if true, applies to everyone
    roles: [String],               // ["student", "teacher"] etc.
    classes: [ObjectId],           // specific classes only
    departments: [ObjectId]        // specific departments only
  },
  
  // Recurrence (for annual holidays)
  isRecurring: Boolean,
  recurrencePattern: String,       // "yearly"
  
  // Status
  status: String,                  // "active" | "cancelled" | "deleted"
  
  // Meta
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, startDate: 1, endDate: 1 }
// { institution: 1, type: 1 }
```

### 18. Leave Request Schema

```javascript
// Collection: leave_requests
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  applicant: ObjectId,             // ref: users (student/teacher applying)
  
  // Leave details
  leaveType: String,               // "sick" | "personal" | "family" | "vacation" | "other"
  reason: String,
  
  // Date range
  startDate: Date,
  endDate: Date,
  totalDays: Number,
  
  // For partial day leaves
  isHalfDay: Boolean,
  halfDayType: String,             // "first_half" | "second_half"
  
  // Supporting documents (stored in files collection)
  attachments: [{
    fileId: ObjectId,              // ref: files
    name: String,
    type: String
  }],
  
  // Approval workflow
  status: String,                  // "pending" | "approved" | "rejected" | "cancelled"
  
  approvedBy: ObjectId,            // ref: users (admin/coordinator)
  approvedAt: Date,
  rejectedBy: ObjectId,
  rejectedAt: Date,
  rejectionReason: String,
  
  // For students, parent can also apply
  appliedBy: ObjectId,             // ref: users (could be parent for student)
  appliedByRole: String,           // "self" | "parent"
  
  // Meta
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, applicant: 1, status: 1 }
// { institution: 1, startDate: 1, endDate: 1 }
// { status: 1, createdAt: -1 }
```

### 19. Question Paper Schema (AI Generated)

```javascript
// Collection: question_papers
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  subject: ObjectId,               // ref: subjects
  class: ObjectId,                 // ref: classes
  
  // Paper info
  title: String,                   // "Mid-Term Physics Paper 2025"
  description: String,
  
  // Generation method
  generationType: String,          // "topics" | "previous_paper" | "mixed"
  
  // If generated from topics
  topics: [{
    name: String,
    weightage: Number,             // percentage of marks
    questionCount: Number
  }],
  
  // If generated from previous paper
  sourcePapers: [{
    fileId: ObjectId,              // ref: files (uploaded PDF)
    extractedText: String,         // AI-extracted text
    extractedAt: Date
  }],
  
  // AI Generation config
  aiConfig: {
    difficulty: String,            // "easy" | "medium" | "hard" | "mixed"
    questionTypes: [{
      type: String,                // "mcq" | "short_answer" | "long_answer" | "fill_blank" | "true_false"
      count: Number,
      marksPerQuestion: Number
    }],
    totalMarks: Number,
    duration: Number,              // in minutes
    instructions: String
  },
  
  // Generated questions
  questions: [{
    questionNumber: Number,
    type: String,
    question: String,
    
    // For MCQ
    options: [{
      label: String,               // "A", "B", "C", "D"
      text: String
    }],
    correctAnswer: String,         // For MCQ: "A" | For others: answer text
    
    // Marks
    marks: Number,
    
    // Metadata
    topic: String,
    difficulty: String,
    bloomsLevel: String,           // "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create"
    
    // AI confidence
    aiConfidence: Number           // 0-1
  }],
  
  // Answer key (separate for security)
  answerKey: {
    isGenerated: Boolean,
    fileId: ObjectId               // ref: files (PDF of answer key)
  },
  
  // Status
  status: String,                  // "draft" | "published" | "used" | "archived" | "deleted"
  
  // Usage tracking
  usedInExams: [ObjectId],         // ref: exams
  
  // Created by
  createdBy: ObjectId,             // ref: users (teacher)
  
  // AI tracking
  aiGeneration: {
    model: String,                 // "gemini-pro"
    generatedAt: Date,
    tokensUsed: Number,
    regenerationCount: Number
  },
  
  // Meta
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, subject: 1, status: 1 }
// { createdBy: 1, createdAt: -1 }
// { institution: 1, class: 1 }
```

### 20. Fee Structure Schema

```javascript
// Collection: fee_structures
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  academicYear: ObjectId,          // ref: academic_years
  
  name: String,                    // "Annual Fee 2025-26"
  
  // Fee heads
  feeHeads: [{
    name: String,                  // "Tuition Fee", "Transport Fee", etc.
    amount: Number,
    frequency: String,             // "one_time" | "monthly" | "quarterly" | "yearly"
    isOptional: Boolean,
    description: String
  }],
  
  // Applicable to
  applicableTo: {
    classes: [ObjectId],           // ref: classes (empty = all)
    sections: [ObjectId],          // ref: sections (empty = all)
    categories: [String]           // "general" | "obc" | "sc" | "st" | "ews"
  },
  
  // Discounts
  discounts: [{
    name: String,                  // "Sibling Discount", "Merit Scholarship"
    type: String,                  // "percentage" | "fixed"
    value: Number,
    conditions: String
  }],
  
  // Late fee
  lateFee: {
    enabled: Boolean,
    gracePeriodDays: Number,
    type: String,                  // "percentage" | "fixed"
    value: Number,
    maxAmount: Number
  },
  
  // Status
  status: String,                  // "active" | "inactive"
  
  createdAt: Date,
  updatedAt: Date
}
```

### 21. Fee Payment Schema

```javascript
// Collection: fee_payments
{
  _id: ObjectId,
  
  institution: ObjectId,
  student: ObjectId,               // ref: users (student)
  feeStructure: ObjectId,          // ref: fee_structures
  academicYear: ObjectId,
  
  // Invoice details
  invoiceNumber: String,           // "INV-2025-001234"
  invoiceDate: Date,
  dueDate: Date,
  
  // Fee breakdown
  feeItems: [{
    feeHead: String,
    amount: Number,
    discount: Number,
    lateFee: Number,
    netAmount: Number
  }],
  
  // Totals
  totalAmount: Number,
  discountAmount: Number,
  lateFeeAmount: Number,
  netPayable: Number,
  amountPaid: Number,
  balanceDue: Number,
  
  // Payment status
  status: String,                  // "pending" | "partial" | "paid" | "overdue" | "cancelled"
  
  // Payment transactions
  transactions: [{
    transactionId: String,
    amount: Number,
    paymentMethod: String,         // "cash" | "card" | "upi" | "netbanking" | "cheque"
    paymentGateway: String,        // "razorpay" | "stripe" | "offline"
    gatewayTransactionId: String,
    paidAt: Date,
    receiptNumber: String,
    remarks: String
  }],
  
  // Receipt
  receiptGenerated: Boolean,
  receiptUrl: String,
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, student: 1, academicYear: 1 }
// { invoiceNumber: 1 }, { unique: true }
// { status: 1, dueDate: 1 }
```

### 22. Transport Route Schema

```javascript
// Collection: transport_routes
{
  _id: ObjectId,
  
  institution: ObjectId,
  
  routeName: String,               // "Route A - North"
  routeNumber: String,             // "R001"
  
  // Vehicle
  vehicle: {
    number: String,                // "MH12AB1234"
    type: String,                  // "bus" | "van" | "auto"
    capacity: Number,
    gpsDeviceId: String
  },
  
  // Staff
  driver: {
    name: String,
    phone: String,
    licenseNumber: String
  },
  conductor: {
    name: String,
    phone: String
  },
  
  // Route stops
  stops: [{
    order: Number,
    name: String,                  // "Green Park Colony"
    landmark: String,
    pickupTime: String,            // "07:30 AM"
    dropTime: String,              // "03:00 PM"
    coordinates: {
      lat: Number,
      lng: Number
    }
  }],
  
  // Assigned students
  students: [{
    student: ObjectId,             // ref: users
    stop: Number,                  // stop order number
    transportFee: Number
  }],
  
  // Status
  status: String,                  // "active" | "inactive"
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, routeNumber: 1 }, { unique: true }
// { "students.student": 1 }
```

### 23. Library Book Schema

```javascript
// Collection: library_books
{
  _id: ObjectId,
  
  institution: ObjectId,
  
  // Book details
  title: String,
  authors: [String],
  isbn: String,
  publisher: String,
  publishYear: Number,
  edition: String,
  
  // Classification
  category: String,                // "fiction" | "reference" | "textbook" | "journal"
  subject: String,
  language: String,
  
  // Physical
  location: String,                // "Shelf A3"
  barcode: String,
  
  // Copies
  totalCopies: Number,
  availableCopies: Number,
  
  // Cover image
  coverImage: String,              // URL
  
  // Status
  status: String,                  // "active" | "archived"
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, isbn: 1 }
// { institution: 1, barcode: 1 }, { unique: true }
// { title: "text", authors: "text" }
```

### 24. Library Transaction Schema

```javascript
// Collection: library_transactions
{
  _id: ObjectId,
  
  institution: ObjectId,
  book: ObjectId,                  // ref: library_books
  member: ObjectId,                // ref: users (student/teacher)
  
  // Issue details
  issueDate: Date,
  dueDate: Date,
  returnDate: Date,
  
  // Renewal
  renewalCount: Number,
  maxRenewals: Number,
  
  // Status
  status: String,                  // "issued" | "returned" | "overdue" | "lost"
  
  // Fine
  fine: {
    amount: Number,
    reason: String,                // "overdue" | "damaged" | "lost"
    paid: Boolean,
    paidAt: Date
  },
  
  // Staff who processed
  issuedBy: ObjectId,              // ref: users (librarian)
  returnedTo: ObjectId,
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, member: 1, status: 1 }
// { book: 1, status: 1 }
// { dueDate: 1, status: 1 }
```

### 25. Hostel Room Schema

```javascript
// Collection: hostel_rooms
{
  _id: ObjectId,
  
  institution: ObjectId,
  
  // Building/Block
  building: String,                // "Boys Hostel A"
  floor: Number,
  
  // Room details
  roomNumber: String,              // "A-101"
  roomType: String,                // "single" | "double" | "triple" | "dormitory"
  capacity: Number,
  
  // Amenities
  amenities: [String],             // ["AC", "Attached Bathroom", "WiFi"]
  
  // Occupants
  occupants: [{
    student: ObjectId,             // ref: users
    bed: String,                   // "A", "B", "C"
    assignedFrom: Date,
    assignedTo: Date
  }],
  
  currentOccupancy: Number,
  
  // Fee
  roomFee: Number,                 // Per month/semester
  
  // Status
  status: String,                  // "available" | "occupied" | "maintenance"
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, building: 1, roomNumber: 1 }, { unique: true }
// { "occupants.student": 1 }
```

### 26. Hostel Mess Menu Schema

```javascript
// Collection: hostel_mess
{
  _id: ObjectId,
  
  institution: ObjectId,
  
  // Week/Date range
  weekStartDate: Date,
  weekEndDate: Date,
  
  // Menu
  menu: [{
    day: String,                   // "monday" | "tuesday" | ...
    meals: {
      breakfast: {
        items: [String],
        timing: String             // "07:00 - 09:00"
      },
      lunch: {
        items: [String],
        timing: String
      },
      snacks: {
        items: [String],
        timing: String
      },
      dinner: {
        items: [String],
        timing: String
      }
    }
  }],
  
  // Mess fee
  messFee: Number,                 // Per month
  
  status: String,                  // "active" | "archived"
  
  createdAt: Date,
  updatedAt: Date
}
```

### 27. Salary Structure Schema

```javascript
// Collection: salary_structures
{
  _id: ObjectId,
  
  institution: ObjectId,
  
  name: String,                    // "Teacher Grade A"
  
  // Earnings
  earnings: [{
    component: String,             // "Basic", "HRA", "DA", "Transport Allowance"
    type: String,                  // "fixed" | "percentage"
    value: Number,                 // Amount or percentage of basic
    taxable: Boolean
  }],
  
  // Deductions
  deductions: [{
    component: String,             // "PF", "ESI", "TDS", "Professional Tax"
    type: String,                  // "fixed" | "percentage"
    value: Number,
    employerContribution: Number   // For PF, ESI
  }],
  
  // Applicable to roles
  applicableRoles: [String],       // ["teacher", "coordinator", "staff"]
  
  status: String,                  // "active" | "inactive"
  
  createdAt: Date,
  updatedAt: Date
}
```

### 28. Employee Salary Schema

```javascript
// Collection: employee_salaries
{
  _id: ObjectId,
  
  institution: ObjectId,
  employee: ObjectId,              // ref: users (teacher/staff)
  salaryStructure: ObjectId,       // ref: salary_structures
  
  // Bank details
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  
  // Salary details
  basicSalary: Number,
  
  // Monthly breakdown (computed)
  monthlyEarnings: {
    basic: Number,
    hra: Number,
    da: Number,
    otherAllowances: Number,
    grossSalary: Number
  },
  
  monthlyDeductions: {
    pf: Number,
    esi: Number,
    tds: Number,
    professionalTax: Number,
    otherDeductions: Number,
    totalDeductions: Number
  },
  
  netSalary: Number,
  
  // Tax info
  panNumber: String,
  pfNumber: String,
  esiNumber: String,
  
  status: String,                  // "active" | "inactive"
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, employee: 1 }, { unique: true }
```

### 29. Payroll Schema

```javascript
// Collection: payroll
{
  _id: ObjectId,
  
  institution: ObjectId,
  employee: ObjectId,              // ref: users
  employeeSalary: ObjectId,        // ref: employee_salaries
  
  // Period
  month: Number,                   // 1-12
  year: Number,
  
  // Working days
  totalWorkingDays: Number,
  daysWorked: Number,
  leavesTaken: Number,
  lop: Number,                     // Loss of Pay days
  
  // Earnings
  earnings: [{
    component: String,
    amount: Number
  }],
  totalEarnings: Number,
  
  // Deductions
  deductions: [{
    component: String,
    amount: Number
  }],
  totalDeductions: Number,
  
  // Net
  netSalary: Number,
  
  // Payment
  paymentStatus: String,           // "pending" | "processed" | "paid" | "failed"
  paymentMethod: String,           // "bank_transfer" | "cash" | "cheque"
  paymentDate: Date,
  transactionRef: String,
  
  // Payslip
  payslipGenerated: Boolean,
  payslipUrl: String,
  
  // Approved by
  approvedBy: ObjectId,            // ref: users (admin)
  approvedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, employee: 1, month: 1, year: 1 }, { unique: true }
// { institution: 1, year: 1, month: 1, paymentStatus: 1 }
```

### 30. Admission Application Schema

```javascript
// Collection: admission_applications
{
  _id: ObjectId,
  
  institution: ObjectId,
  academicYear: ObjectId,
  
  // Application number
  applicationNumber: String,        // "ADM-2025-001234"
  
  // Applicant details
  applicant: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,                 // "male" | "female" | "other"
    email: String,
    phone: String,
    photo: String,                  // URL
    
    // Address
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    }
  },
  
  // Parent/Guardian details
  guardian: {
    fatherName: String,
    fatherPhone: String,
    fatherEmail: String,
    fatherOccupation: String,
    motherName: String,
    motherPhone: String,
    motherOccupation: String
  },
  
  // Applied for
  applyingFor: {
    class: ObjectId,               // ref: classes
    section: ObjectId,             // ref: sections (optional preference)
    stream: String                 // For higher classes
  },
  
  // Previous education
  previousEducation: {
    schoolName: String,
    board: String,
    class: String,
    percentage: Number,
    yearOfPassing: Number
  },
  
  // Documents uploaded
  documents: [{
    type: String,                  // "birth_certificate" | "marksheet" | "transfer_certificate" | "photo" | "aadhar"
    fileId: ObjectId,              // ref: files
    fileName: String,
    verified: Boolean,
    verifiedBy: ObjectId,
    verifiedAt: Date,
    remarks: String
  }],
  
  // Entrance test (if applicable)
  entranceTest: {
    scheduled: Boolean,
    scheduledDate: Date,
    attended: Boolean,
    score: Number,
    maxScore: Number,
    result: String                 // "pass" | "fail"
  },
  
  // Application status
  status: String,                  // "draft" | "submitted" | "under_review" | "documents_pending" | "test_scheduled" | "approved" | "rejected" | "enrolled"
  
  // Review
  reviewedBy: ObjectId,
  reviewedAt: Date,
  reviewRemarks: String,
  rejectionReason: String,
  
  // Admission
  admittedTo: {
    class: ObjectId,
    section: ObjectId,
    rollNumber: String,
    admissionDate: Date
  },
  
  // Fee
  admissionFeeInvoice: ObjectId,   // ref: fee_payments
  feePaid: Boolean,
  
  // Timestamps
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, applicationNumber: 1 }, { unique: true }
// { institution: 1, status: 1, academicYear: 1 }
// { "applicant.email": 1 }
```

### 31. Event Schema

```javascript
// Collection: events
{
  _id: ObjectId,
  
  institution: ObjectId,
  
  // Event details
  title: String,
  description: String,
  
  // Type
  eventType: String,               // "academic" | "sports" | "cultural" | "competition" | "workshop" | "seminar" | "exam" | "holiday" | "other"
  
  // Schedule
  startDate: Date,
  endDate: Date,
  startTime: String,
  endTime: String,
  isAllDay: Boolean,
  
  // Location
  venue: String,
  isOnline: Boolean,
  onlineLink: String,
  
  // Organizer
  organizer: ObjectId,             // ref: users
  department: ObjectId,            // ref: departments
  
  // Participants
  targetAudience: {
    all: Boolean,
    roles: [String],               // ["student", "teacher", "parent"]
    classes: [ObjectId],
    sections: [ObjectId],
    departments: [ObjectId]
  },
  
  // Registration
  requiresRegistration: Boolean,
  registrationDeadline: Date,
  maxParticipants: Number,
  registeredCount: Number,
  
  // For competitions
  competition: {
    isCompetition: Boolean,
    categories: [{
      name: String,
      description: String,
      maxParticipants: Number
    }],
    rounds: [{
      name: String,
      date: Date,
      venue: String
    }],
    judges: [ObjectId],            // ref: users
    results: [{
      category: String,
      position: Number,            // 1st, 2nd, 3rd
      participant: ObjectId,       // ref: users or team
      score: Number
    }]
  },
  
  // Media
  coverImage: String,
  gallery: [{
    fileId: ObjectId,
    caption: String,
    uploadedAt: Date
  }],
  
  // Certificates
  certificateTemplate: ObjectId,   // ref: files
  certificatesGenerated: Boolean,
  
  // Status
  status: String,                  // "draft" | "published" | "ongoing" | "completed" | "cancelled"
  
  // Notifications
  remindersSent: [{
    type: String,                  // "1_week" | "1_day" | "1_hour"
    sentAt: Date
  }],
  
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { institution: 1, startDate: 1, status: 1 }
// { institution: 1, eventType: 1 }
```

### 32. Event Registration Schema

```javascript
// Collection: event_registrations
{
  _id: ObjectId,
  
  event: ObjectId,                 // ref: events
  participant: ObjectId,           // ref: users
  
  // For competitions
  category: String,
  teamName: String,
  teamMembers: [ObjectId],         // ref: users
  
  // Registration
  registeredAt: Date,
  registeredBy: ObjectId,          // Self or teacher
  
  // Attendance
  attended: Boolean,
  checkedInAt: Date,
  
  // For competitions
  scores: [{
    round: String,
    score: Number,
    judge: ObjectId,
    remarks: String
  }],
  finalPosition: Number,
  
  // Certificate
  certificateGenerated: Boolean,
  certificateUrl: String,
  
  status: String,                  // "registered" | "confirmed" | "attended" | "winner" | "cancelled"
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
// { event: 1, participant: 1 }, { unique: true }
// { event: 1, status: 1 }
```

### 33. Activity Log Schema

```javascript
// Collection: activity_logs
{
  _id: ObjectId,
  
  institution: ObjectId,           // ref: institutions
  user: ObjectId,                  // ref: users
  
  action: String,                  // "create" | "read" | "update" | "delete" | "login" | "logout"
  resource: String,                // "user" | "homework" | "grade" etc.
  resourceId: ObjectId,
  
  // Details
  details: {
    description: String,
    changes: {
      before: Mixed,
      after: Mixed
    }
  },
  
  // Request info
  request: {
    ip: String,
    userAgent: String,
    method: String,
    path: String
  },
  
  // Meta
  timestamp: Date
}

// Indexes
// { institution: 1, timestamp: -1 }
// { user: 1, timestamp: -1 }
// { resource: 1, resourceId: 1 }
// TTL index to auto-delete old logs: { timestamp: 1 }, { expireAfterSeconds: 7776000 } // 90 days
```

---

## Relationships Diagram

```
institutions
    │
    ├── 1:N ── departments
    │              │
    │              └── 1:N ── subjects
    │
    ├── 1:N ── users (all roles)
    │              │
    │              ├── teacherProfile.department ──> departments
    │              ├── studentProfile.class ──> classes
    │              ├── studentProfile.section ──> sections
    │              └── parentProfile.children ──> users (students)
    │
    ├── 1:N ── classes
    │              │
    │              └── 1:N ── sections
    │
    ├── 1:N ── homework
    │              │
    │              └── 1:N ── submissions
    │
    ├── 1:N ── exams
    │              │
    │              └── 1:N ── grades
    │
    ├── 1:N ── attendance
    ├── 1:N ── timetables
    ├── 1:N ── announcements
    └── 1:N ── ai_analytics

users
    │
    └── 1:N ── notifications
```

---

## Indexes Summary

### Performance Indexes
```javascript
// Most queried paths
db.users.createIndex({ institution: 1, role: 1 })
db.users.createIndex({ "studentProfile.class": 1, "studentProfile.section": 1 })
db.homework.createIndex({ class: 1, dueDate: -1, status: 1 })
db.submissions.createIndex({ homework: 1, status: 1 })
db.attendance.createIndex({ "records.student": 1, date: -1 })
db.grades.createIndex({ student: 1, exam: 1 })
db.notifications.createIndex({ user: 1, isRead: 1, createdAt: -1 })
```

### Unique Indexes
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.institutions.createIndex({ code: 1 }, { unique: true })
db.departments.createIndex({ institution: 1, code: 1 }, { unique: true })
db.subjects.createIndex({ institution: 1, code: 1 }, { unique: true })
```

---

*Document Version: 1.1*
*Last Updated: January 2025*
*Project: Meridian EMS*
