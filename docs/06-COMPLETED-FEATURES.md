# Meridian EMS - Backend Completed Features

## Quick Testing Guide

### Server
```bash
cd meridian-backend
npm run dev
# Server runs on http://localhost:5000
```

### Database Seeding
```bash
npm run seed
```

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@meridian-ems.com` | `Admin@123456` |
| Institution Admin | `principal@demo.meridian-ems.com` | `Principal@123` |
| Teacher | `teacher@demo.meridian-ems.com` | `Teacher@123` |
| Student | `student@demo.meridian-ems.com` | `Student@123` |
| Parent | `parent@demo.meridian-ems.com` | `Parent@123` |

---

## Completed API Endpoints

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/login` | Login with email/password | ✅ Working |
| POST | `/register` | Register new institution + admin | ✅ Working |
| GET | `/me` | Get current user profile | ✅ Working |
| POST | `/logout` | Logout (invalidate token) | ✅ Working |
| POST | `/refresh` | Refresh access token | ✅ Working |
| POST | `/change-password` | Change password | ✅ Working |

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"principal@demo.meridian-ems.com","password":"Principal@123"}'
```

---

### 2. Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List all users (with filters) | Teacher+ |
| POST | `/` | Create new user | Admin |
| GET | `/:id` | Get user by ID | Teacher+ |
| PUT | `/:id` | Update user | Admin |
| DELETE | `/:id` | Delete user | Admin |
| GET | `/role/:role` | Get users by role | Teacher+ |

**Test Get Users:**
```bash
curl http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Institutions (`/api/v1/institutions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get current user's institution | Any |
| PUT | `/me` | Update current institution | Institution Admin |
| GET | `/me/stats` | Get institution stats | Any |
| GET | `/dashboard` | Get dashboard stats | Any |
| GET | `/` | List all institutions | Platform Admin |
| GET | `/:id` | Get institution by ID | Platform Admin |
| PUT | `/:id` | Update institution | Platform Admin |

**Test Dashboard Stats:**
```bash
curl http://localhost:5000/api/v1/institutions/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Classes (`/api/v1/classes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List all classes | Any |
| POST | `/` | Create class | Admin |
| GET | `/:id` | Get class by ID | Any |
| PUT | `/:id` | Update class | Admin |
| DELETE | `/:id` | Delete class | Admin |
| GET | `/:id/students` | Get class students | Teacher+ |
| GET | `/:classId/sections` | Get sections | Any |
| POST | `/:classId/sections` | Create section | Admin |
| PUT | `/sections/:sectionId` | Update section | Admin |
| DELETE | `/sections/:sectionId` | Delete section | Admin |

---

### 5. Attendance (`/api/v1/attendance`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get my attendance | Any |
| GET | `/stats` | Get attendance stats | Teacher+ |
| GET | `/class/:classId` | Get class attendance | Teacher+ |
| GET | `/user/:userId` | Get user attendance report | Teacher+ |
| POST | `/` | Mark single attendance | Teacher+ |
| POST | `/bulk` | Mark bulk attendance | Teacher+ |
| GET | `/` | Get attendance records | Teacher+ |

**Test Attendance Stats:**
```bash
curl http://localhost:5000/api/v1/attendance/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Fees (`/api/v1/fees`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get my fees | Any |
| GET | `/structures` | Get fee structures | Teacher+ |
| POST | `/structures` | Create fee structure | Admin |
| PUT | `/structures/:id` | Update fee structure | Admin |
| GET | `/stats` | Get fee stats | Teacher+ |
| GET | `/defaulters` | Get fee defaulters | Teacher+ |
| GET | `/student/:studentId` | Get student fees | Teacher+ |
| GET | `/payments` | Get fee payments | Teacher+ |
| POST | `/payments` | Record payment | Admin/Staff |

**Test Fee Stats:**
```bash
curl http://localhost:5000/api/v1/fees/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Role Hierarchy

```
super_admin (8)    - Full platform access
    ↓
admin (7)          - Platform admin, manages institutions
    ↓
institution_admin (6) - Full institution access
    ↓
coordinator (5)    - Academic coordination
    ↓
teacher (4)        - Teaching and grading
    ↓
staff (3)          - Administrative tasks
    ↓
parent (2)         - View child's data
    ↓
student (1)        - View own data
```

---

## Models Created

| Model | File | Description |
|-------|------|-------------|
| User | `src/models/User.js` | User accounts with role-based profiles |
| Institution | `src/models/Institution.js` | School/college details |
| Class | `src/models/Class.js` | Class/grade definitions |
| Section | `src/models/Section.js` | Sections within classes |
| Subject | `src/models/Subject.js` | Subject definitions |
| Attendance | `src/models/Attendance.js` | Daily attendance records |
| FeeStructure | `src/models/Fee.js` | Fee types and amounts |
| FeePayment | `src/models/Fee.js` | Payment transactions |

---

## Middleware

| Middleware | Description |
|------------|-------------|
| `protect` | Verify JWT token |
| `authorize(...roles)` | Check specific roles |
| `authorizeMinRole(role)` | Check minimum role level |
| `sameInstitution` | Ensure same institution access |
| `isPlatformAdmin` | Check super_admin or admin role |

---

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
APP_NAME=Meridian EMS
FRONTEND_URL=http://localhost:3001

# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION_MINUTES=60
JWT_REFRESH_EXPIRATION_DAYS=30
```

---

## Pending Features

- [ ] Homework module
- [ ] Exams and Results
- [ ] Library management
- [ ] Transport management
- [ ] Hostel management
- [ ] Payroll/Salary
- [ ] Events management
- [ ] Notifications
- [ ] Reports and Analytics
- [ ] AI Assistant integration
