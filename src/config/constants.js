module.exports = {
  // User Roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    INSTITUTION_ADMIN: 'institution_admin',
    COORDINATOR: 'coordinator',
    TEACHER: 'teacher',
    STUDENT: 'student',
    PARENT: 'parent',
    STAFF: 'staff'
  },

  // Role Hierarchy (for permission checks)
  // Super Admin > Admin > Institution Admin > Coordinator > Teacher > Staff > Parent > Student
  ROLE_HIERARCHY: {
    super_admin: 8,
    admin: 7,
    institution_admin: 6,
    coordinator: 5,
    teacher: 4,
    staff: 3,
    parent: 2,
    student: 1
  },

  // Institution Types
  INSTITUTION_TYPES: {
    PRIMARY: 'primary',
    MIDDLE: 'middle',
    SECONDARY: 'secondary',
    HIGHER_SECONDARY: 'higher_secondary',
    COLLEGE: 'college',
    UNIVERSITY: 'university',
    COACHING: 'coaching',
    VOCATIONAL: 'vocational',
    SPECIAL_EDUCATION: 'special_education',
    PRESCHOOL: 'preschool',
    INTERNATIONAL: 'international',
    ONLINE: 'online'
  },

  // Subscription Plans
  SUBSCRIPTION_PLANS: {
    FREE: 'free',
    BASIC: 'basic',
    PREMIUM: 'premium',
    ENTERPRISE: 'enterprise'
  },

  // Content Status
  STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    DELETED: 'deleted',
    ARCHIVED: 'archived'
  },

  // Attendance Status
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    HALF_DAY: 'half_day',
    HOLIDAY: 'holiday',
    LEAVE: 'leave'
  },

  // Leave Status
  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  },

  // Fee Status
  FEE_STATUS: {
    PENDING: 'pending',
    PARTIAL: 'partial',
    PAID: 'paid',
    OVERDUE: 'overdue',
    WAIVED: 'waived'
  },

  // Admission Status
  ADMISSION_STATUS: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    DOCUMENTS_PENDING: 'documents_pending',
    TEST_SCHEDULED: 'test_scheduled',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ENROLLED: 'enrolled'
  },

  // Event Types
  EVENT_TYPES: {
    ACADEMIC: 'academic',
    SPORTS: 'sports',
    CULTURAL: 'cultural',
    COMPETITION: 'competition',
    WORKSHOP: 'workshop',
    SEMINAR: 'seminar',
    EXAM: 'exam',
    HOLIDAY: 'holiday',
    OTHER: 'other'
  },

  // Library Transaction Types
  LIBRARY_TRANSACTION: {
    ISSUE: 'issue',
    RETURN: 'return',
    RENEW: 'renew',
    RESERVE: 'reserve',
    LOST: 'lost'
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    HOMEWORK: 'homework',
    ATTENDANCE: 'attendance',
    FEE: 'fee',
    ANNOUNCEMENT: 'announcement',
    EVENT: 'event',
    EXAM: 'exam',
    RESULT: 'result',
    MESSAGE: 'message',
    SYSTEM: 'system'
  },

  // File Types
  ALLOWED_FILE_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    ALL: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // Languages
  LANGUAGES: {
    EN: 'en',
    HI: 'hi',
    ES: 'es',
    FR: 'fr',
    AR: 'ar',
    ZH: 'zh',
    PT: 'pt',
    DE: 'de'
  },

  // Days of Week
  DAYS_OF_WEEK: [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ]
};
