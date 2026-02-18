const mongoose = require('mongoose');

// Define all available modules/features in the system
const MODULES = {
  DASHBOARD: 'dashboard',
  USER_MANAGEMENT: 'user_management',
  ACADEMICS: 'academics',
  ATTENDANCE: 'attendance',
  HOMEWORK: 'homework',
  EXAMINATIONS: 'examinations',
  FEE_MANAGEMENT: 'fee_management',
  LIBRARY: 'library',
  TRANSPORT: 'transport',
  HOSTEL: 'hostel',
  EVENTS: 'events',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  PAYROLL: 'payroll',
  ADMISSIONS: 'admissions',
  SETTINGS: 'settings',
  AI_ASSISTANT: 'ai_assistant'
};

// Define permission types for each module
const PERMISSION_TYPES = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE: 'manage' // Full access including settings
};

// Permission schema for each module
const modulePermissionSchema = new mongoose.Schema({
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  manage: { type: Boolean, default: false }
}, { _id: false });

// Role schema
const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  // Whether this is a system default role (cannot be deleted)
  isDefault: {
    type: Boolean,
    default: false
  },
  // Whether this role is active
  isActive: {
    type: Boolean,
    default: true
  },
  // Module-wise permissions
  permissions: {
    dashboard: { type: modulePermissionSchema, default: () => ({ view: true }) },
    user_management: { type: modulePermissionSchema, default: () => ({}) },
    academics: { type: modulePermissionSchema, default: () => ({}) },
    attendance: { type: modulePermissionSchema, default: () => ({}) },
    homework: { type: modulePermissionSchema, default: () => ({}) },
    examinations: { type: modulePermissionSchema, default: () => ({}) },
    fee_management: { type: modulePermissionSchema, default: () => ({}) },
    library: { type: modulePermissionSchema, default: () => ({}) },
    transport: { type: modulePermissionSchema, default: () => ({}) },
    hostel: { type: modulePermissionSchema, default: () => ({}) },
    events: { type: modulePermissionSchema, default: () => ({}) },
    notifications: { type: modulePermissionSchema, default: () => ({}) },
    reports: { type: modulePermissionSchema, default: () => ({}) },
    payroll: { type: modulePermissionSchema, default: () => ({}) },
    admissions: { type: modulePermissionSchema, default: () => ({}) },
    settings: { type: modulePermissionSchema, default: () => ({}) },
    ai_assistant: { type: modulePermissionSchema, default: () => ({}) }
  },
  // Special permissions
  specialPermissions: {
    canViewAllStudents: { type: Boolean, default: false },
    canViewAllTeachers: { type: Boolean, default: false },
    canViewAllStaff: { type: Boolean, default: false },
    canManageRoles: { type: Boolean, default: false },
    canManageInstitution: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canImportData: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canViewFinancials: { type: Boolean, default: false }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for unique role name per institution
roleSchema.index({ slug: 1, institution: 1 }, { unique: true });
roleSchema.index({ institution: 1 });
roleSchema.index({ isDefault: 1 });

// Pre-save hook to generate slug from name
roleSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  next();
});

// Method to check if role has permission for a module and action
roleSchema.methods.hasPermission = function(module, action) {
  if (!this.permissions[module]) return false;
  return this.permissions[module][action] === true;
};

// Method to check if role has any permission for a module
roleSchema.methods.canAccessModule = function(module) {
  if (!this.permissions[module]) return false;
  const perms = this.permissions[module];
  return perms.view || perms.create || perms.edit || perms.delete || perms.manage;
};

// Static method to get default roles template
roleSchema.statics.getDefaultRolesTemplate = function() {
  return [
    {
      name: 'Institution Admin',
      slug: 'institution_admin',
      description: 'Full access to manage the institution',
      isDefault: true,
      permissions: {
        dashboard: { view: true, manage: true },
        user_management: { view: true, create: true, edit: true, delete: true, manage: true },
        academics: { view: true, create: true, edit: true, delete: true, manage: true },
        attendance: { view: true, create: true, edit: true, delete: true, manage: true },
        homework: { view: true, create: true, edit: true, delete: true, manage: true },
        examinations: { view: true, create: true, edit: true, delete: true, manage: true },
        fee_management: { view: true, create: true, edit: true, delete: true, manage: true },
        library: { view: true, create: true, edit: true, delete: true, manage: true },
        transport: { view: true, create: true, edit: true, delete: true, manage: true },
        hostel: { view: true, create: true, edit: true, delete: true, manage: true },
        events: { view: true, create: true, edit: true, delete: true, manage: true },
        notifications: { view: true, create: true, edit: true, delete: true, manage: true },
        reports: { view: true, create: true, edit: true, delete: true, manage: true },
        payroll: { view: true, create: true, edit: true, delete: true, manage: true },
        admissions: { view: true, create: true, edit: true, delete: true, manage: true },
        settings: { view: true, create: true, edit: true, delete: true, manage: true },
        ai_assistant: { view: true, manage: true }
      },
      specialPermissions: {
        canViewAllStudents: true,
        canViewAllTeachers: true,
        canViewAllStaff: true,
        canManageRoles: true,
        canManageInstitution: true,
        canExportData: true,
        canImportData: true,
        canViewReports: true,
        canViewFinancials: true
      }
    },
    {
      name: 'Coordinator',
      slug: 'coordinator',
      description: 'Academic coordinator with management access',
      isDefault: true,
      permissions: {
        dashboard: { view: true },
        user_management: { view: true, create: true, edit: true },
        academics: { view: true, create: true, edit: true, delete: true, manage: true },
        attendance: { view: true, create: true, edit: true, manage: true },
        homework: { view: true, create: true, edit: true, delete: true, manage: true },
        examinations: { view: true, create: true, edit: true, delete: true, manage: true },
        fee_management: { view: true },
        library: { view: true, create: true, edit: true },
        transport: { view: true },
        hostel: { view: true },
        events: { view: true, create: true, edit: true },
        notifications: { view: true, create: true },
        reports: { view: true },
        payroll: { view: false },
        admissions: { view: true, create: true, edit: true },
        settings: { view: true },
        ai_assistant: { view: true }
      },
      specialPermissions: {
        canViewAllStudents: true,
        canViewAllTeachers: true,
        canViewAllStaff: false,
        canManageRoles: false,
        canManageInstitution: false,
        canExportData: true,
        canImportData: true,
        canViewReports: true,
        canViewFinancials: false
      }
    },
    {
      name: 'Teacher',
      slug: 'teacher',
      description: 'Teaching staff with class management access',
      isDefault: true,
      permissions: {
        dashboard: { view: true },
        user_management: { view: true },
        academics: { view: true },
        attendance: { view: true, create: true, edit: true },
        homework: { view: true, create: true, edit: true, delete: true },
        examinations: { view: true, create: true, edit: true },
        fee_management: { view: false },
        library: { view: true },
        transport: { view: true },
        hostel: { view: true },
        events: { view: true },
        notifications: { view: true, create: true },
        reports: { view: true },
        payroll: { view: false },
        admissions: { view: false },
        settings: { view: false },
        ai_assistant: { view: true }
      },
      specialPermissions: {
        canViewAllStudents: true,
        canViewAllTeachers: false,
        canViewAllStaff: false,
        canManageRoles: false,
        canManageInstitution: false,
        canExportData: true,
        canImportData: false,
        canViewReports: true,
        canViewFinancials: false
      }
    },
    {
      name: 'Staff',
      slug: 'staff',
      description: 'Non-teaching staff with limited access',
      isDefault: true,
      permissions: {
        dashboard: { view: true },
        user_management: { view: true },
        academics: { view: true },
        attendance: { view: true },
        homework: { view: false },
        examinations: { view: false },
        fee_management: { view: true, create: true, edit: true },
        library: { view: true, create: true, edit: true },
        transport: { view: true, create: true, edit: true },
        hostel: { view: true, create: true, edit: true },
        events: { view: true },
        notifications: { view: true },
        reports: { view: false },
        payroll: { view: false },
        admissions: { view: true, create: true },
        settings: { view: false },
        ai_assistant: { view: false }
      },
      specialPermissions: {
        canViewAllStudents: true,
        canViewAllTeachers: false,
        canViewAllStaff: false,
        canManageRoles: false,
        canManageInstitution: false,
        canExportData: false,
        canImportData: false,
        canViewReports: false,
        canViewFinancials: false
      }
    },
    {
      name: 'Student',
      slug: 'student',
      description: 'Student with view access to own data',
      isDefault: true,
      permissions: {
        dashboard: { view: true },
        user_management: { view: false },
        academics: { view: true },
        attendance: { view: true },
        homework: { view: true, create: true },
        examinations: { view: true },
        fee_management: { view: true },
        library: { view: true },
        transport: { view: true },
        hostel: { view: true },
        events: { view: true },
        notifications: { view: true },
        reports: { view: true },
        payroll: { view: false },
        admissions: { view: false },
        settings: { view: false },
        ai_assistant: { view: true }
      },
      specialPermissions: {
        canViewAllStudents: false,
        canViewAllTeachers: false,
        canViewAllStaff: false,
        canManageRoles: false,
        canManageInstitution: false,
        canExportData: false,
        canImportData: false,
        canViewReports: false,
        canViewFinancials: false
      }
    },
    {
      name: 'Parent',
      slug: 'parent',
      description: 'Parent with view access to children data',
      isDefault: true,
      permissions: {
        dashboard: { view: true },
        user_management: { view: false },
        academics: { view: true },
        attendance: { view: true },
        homework: { view: true },
        examinations: { view: true },
        fee_management: { view: true, create: true },
        library: { view: true },
        transport: { view: true },
        hostel: { view: true },
        events: { view: true },
        notifications: { view: true },
        reports: { view: true },
        payroll: { view: false },
        admissions: { view: false },
        settings: { view: false },
        ai_assistant: { view: false }
      },
      specialPermissions: {
        canViewAllStudents: false,
        canViewAllTeachers: false,
        canViewAllStaff: false,
        canManageRoles: false,
        canManageInstitution: false,
        canExportData: false,
        canImportData: false,
        canViewReports: false,
        canViewFinancials: false
      }
    },
    {
      name: 'Accountant',
      slug: 'accountant',
      description: 'Finance staff with fee and payroll access',
      isDefault: true,
      permissions: {
        dashboard: { view: true },
        user_management: { view: true },
        academics: { view: false },
        attendance: { view: false },
        homework: { view: false },
        examinations: { view: false },
        fee_management: { view: true, create: true, edit: true, delete: true, manage: true },
        library: { view: false },
        transport: { view: false },
        hostel: { view: false },
        events: { view: false },
        notifications: { view: true, create: true },
        reports: { view: true },
        payroll: { view: true, create: true, edit: true, manage: true },
        admissions: { view: true },
        settings: { view: false },
        ai_assistant: { view: false }
      },
      specialPermissions: {
        canViewAllStudents: true,
        canViewAllTeachers: true,
        canViewAllStaff: true,
        canManageRoles: false,
        canManageInstitution: false,
        canExportData: true,
        canImportData: true,
        canViewReports: true,
        canViewFinancials: true
      }
    },
    {
      name: 'Librarian',
      slug: 'librarian',
      description: 'Library staff with full library access',
      isDefault: true,
      permissions: {
        dashboard: { view: true },
        user_management: { view: true },
        academics: { view: false },
        attendance: { view: false },
        homework: { view: false },
        examinations: { view: false },
        fee_management: { view: false },
        library: { view: true, create: true, edit: true, delete: true, manage: true },
        transport: { view: false },
        hostel: { view: false },
        events: { view: true },
        notifications: { view: true, create: true },
        reports: { view: true },
        payroll: { view: false },
        admissions: { view: false },
        settings: { view: false },
        ai_assistant: { view: false }
      },
      specialPermissions: {
        canViewAllStudents: true,
        canViewAllTeachers: true,
        canViewAllStaff: false,
        canManageRoles: false,
        canManageInstitution: false,
        canExportData: true,
        canImportData: true,
        canViewReports: true,
        canViewFinancials: false
      }
    }
  ];
};

// Export constants along with model
const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
module.exports.MODULES = MODULES;
module.exports.PERMISSION_TYPES = PERMISSION_TYPES;
