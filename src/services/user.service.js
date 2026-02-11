const User = require('../models/User');
const Institution = require('../models/Institution');
const Class = require('../models/Class');
const Section = require('../models/Section');
const { FeePayment } = require('../models/Fee');
const { TransportAllocation } = require('../models/Transport');
const { RoomAllocation } = require('../models/Hostel');
const { BookIssue } = require('../models/Library');
const { EmployeeSalary, Payslip, Bonus, Advance } = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const ApiError = require('../utils/apiError');
const { generatePassword } = require('../utils/helpers');
const emailService = require('../utils/emailService');

class UserService {
  async getUsers(filters, options, institutionId, userRole) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = options;
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    
    // If institutionId is provided, filter by institution
    // If null (super_admin/admin), show all users
    if (institutionId) {
      query.institution = institutionId;
    }

    // Apply filters
    if (filters.role) {
      // Support comma-separated roles for filtering multiple roles
      if (filters.role.includes(',')) {
        query.role = { $in: filters.role.split(',').map(r => r.trim()) };
      } else {
        query.role = filters.role;
      }
    }
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      query.$or = [
        { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
        { 'profile.lastName': { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    // Base query for stats (without pagination filters like search)
    const statsQuery = { isActive: true };
    if (institutionId) {
      statsQuery.institution = institutionId;
    }

    const [users, total, studentCount, teacherCount, parentCount, staffCount] = await Promise.all([
      User.find(query)
        .select('-password -__v -refreshToken')
        .populate('institution', 'name code')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
      User.countDocuments({ ...statsQuery, role: 'student' }),
      User.countDocuments({ ...statsQuery, role: 'teacher' }),
      User.countDocuments({ ...statsQuery, role: 'parent' }),
      User.countDocuments({ ...statsQuery, role: 'staff' })
    ]);

    return {
      data: users,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total: studentCount + teacherCount + parentCount + staffCount,
        students: studentCount,
        teachers: teacherCount,
        parents: parentCount,
        staff: staffCount
      }
    };
  }

  async getUserById(id, institutionId) {
    const query = { _id: id, isActive: true };
    if (institutionId) {
      query.institution = institutionId;
    }
    const user = await User.findOne(query)
      .select('-password -__v -refreshToken')
      .populate('institution', 'name code');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  async getUserFullDetails(id, institutionId) {
    const query = { _id: id };
    if (institutionId) {
      query.institution = institutionId;
    }
    
    const user = await User.findOne(query)
      .select('-password -__v -refreshToken')
      .populate('institution', 'name code')
      .populate({ path: 'studentData.class', select: 'name' })
      .populate({ path: 'studentData.section', select: 'name' })
      .populate({ path: 'studentData.parent', select: 'profile.firstName profile.lastName email' })
      .populate({ path: 'parentData.children', select: 'profile.firstName profile.lastName email studentData' })
      .lean();

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Manually populate class and section if they're ObjectIds
    if (user.role === 'student' && user.studentData) {
      if (user.studentData.class && typeof user.studentData.class !== 'object') {
        const classDoc = await Class.findById(user.studentData.class).select('name').lean();
        if (classDoc) user.studentData.class = classDoc;
      }
      if (user.studentData.section && typeof user.studentData.section !== 'object') {
        const sectionDoc = await Section.findById(user.studentData.section).select('name').lean();
        if (sectionDoc) user.studentData.section = sectionDoc;
      }
    }

    const details = { user };

    // For students - fetch fees, transport, hostel, library, attendance
    if (user.role === 'student') {
      const mongoose = require('mongoose');
      const userId = new mongoose.Types.ObjectId(id);
      
      const [feePayments, transportAllocation, hostelAllocation, libraryBooks, attendance] = await Promise.all([
        FeePayment.find({ student: userId })
          .populate('feeStructure', 'name amount')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        TransportAllocation.findOne({ student: userId, status: 'active', isDeleted: { $ne: true } })
          .populate('route', 'name startPoint endPoint routeCode')
          .lean(),
        RoomAllocation.findOne({ student: userId, status: 'active' })
          .populate({ path: 'room', select: 'roomNumber block', populate: { path: 'block', select: 'name' } })
          .lean(),
        BookIssue.find({ user: userId })
          .populate('book', 'title author isbn')
          .sort({ issueDate: -1 })
          .limit(10)
          .lean(),
        Attendance.find({ user: userId })
          .sort({ date: -1 })
          .limit(30)
          .lean()
      ]);

      details.fees = {
        payments: feePayments,
        totalPaid: feePayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
        totalPending: feePayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0)
      };
      details.transport = transportAllocation;
      details.hostel = hostelAllocation;
      details.library = {
        books: libraryBooks,
        currentlyIssued: libraryBooks.filter(b => b.status === 'issued').length,
        totalFines: libraryBooks.reduce((sum, b) => sum + (b.fineAmount || 0), 0)
      };
      details.attendance = {
        recent: attendance,
        presentDays: attendance.filter(a => a.status === 'present').length,
        totalDays: attendance.length
      };
    }

    // For teachers/staff - fetch salary, payslips, bonuses, advances
    if (['teacher', 'staff', 'coordinator'].includes(user.role)) {
      const [salary, payslips, bonuses, advances] = await Promise.all([
        EmployeeSalary.findOne({ employee: id })
          .populate('salaryStructure', 'name')
          .lean(),
        Payslip.find({ employee: id })
          .sort({ createdAt: -1 })
          .limit(12)
          .lean(),
        Bonus.find({ employee: id })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Advance.find({ employee: id })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
      ]);

      details.salary = salary;
      details.payslips = payslips;
      details.bonuses = bonuses;
      details.advances = advances;
      details.payrollSummary = {
        totalEarned: payslips.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.netSalary || 0), 0),
        pendingBonuses: bonuses.filter(b => b.status === 'pending').reduce((sum, b) => sum + (b.amount || 0), 0),
        activeAdvances: advances.filter(a => ['disbursed', 'repaying'].includes(a.status)).reduce((sum, a) => sum + (a.remainingAmount || 0), 0)
      };
    }

    // For parents - fetch children details with their info
    if (user.role === 'parent' && user.parentData?.children?.length > 0) {
      const childrenIds = user.parentData.children.map(c => c._id || c);
      const childrenDetails = await Promise.all(
        childrenIds.map(childId => this.getUserFullDetails(childId, institutionId).catch(() => null))
      );
      details.childrenDetails = childrenDetails.filter(Boolean);
    }

    return details;
  }

  async createUser(userData, institutionId, createdBy, creatorRole) {
    const { firstName, lastName, email, password, role, phone, gender, dateOfBirth, address,
            teacherProfile, studentProfile, parentProfile, staffProfile } = userData;

    // Only super_admin can create admin role
    if (role === 'admin' && creatorRole !== 'super_admin') {
      throw ApiError.forbidden('Only super admin can create admin users');
    }
    
    // Nobody can create super_admin via API
    if (role === 'super_admin') {
      throw ApiError.forbidden('Super admin cannot be created via API');
    }

    // Institution is required for roles other than admin
    if (role !== 'admin' && !institutionId) {
      throw ApiError.badRequest('Institution is required for this role. Please select an institution.');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    // Generate password if not provided
    const userPassword = password || generatePassword();

    // Build user object with proper structure
    const newUser = {
      email,
      password: userPassword,
      role,
      institution: institutionId,
      profile: {
        firstName,
        lastName,
        phone: phone || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined
      },
      createdBy,
      isActive: true,
      isEmailVerified: false,
      mustChangePassword: true
    };

    // Add role-specific data
    if (role === 'teacher' && teacherProfile) {
      newUser.teacherData = {
        employeeId: teacherProfile.employeeId,
        qualification: teacherProfile.qualifications,
        joiningDate: teacherProfile.joiningDate || new Date()
      };
    }

    if (role === 'student' && studentProfile) {
      newUser.studentData = {
        admissionNumber: studentProfile.admissionNumber,
        rollNumber: studentProfile.rollNumber,
        admissionDate: studentProfile.admissionDate || new Date(),
        class: studentProfile.class || undefined,
        section: studentProfile.section || undefined
      };
    }

    if (role === 'parent' && parentProfile) {
      newUser.parentData = {
        occupation: parentProfile.occupation,
        relation: parentProfile.relation,
        children: parentProfile.children || []
      };
    }

    if (role === 'staff' && staffProfile) {
      newUser.staffData = {
        employeeId: staffProfile.employeeId,
        department: staffProfile.department,
        designation: staffProfile.designation,
        joiningDate: staffProfile.joiningDate || new Date()
      };
    }

    const user = await User.create(newUser);

    // If parent, update children's studentData.parent reference
    if (role === 'parent' && parentProfile?.children?.length > 0) {
      await User.updateMany(
        { _id: { $in: parentProfile.children }, role: 'student' },
        { $set: { 'studentData.parent': user._id } }
      );
    }

    // Send welcome email with credentials
    const userName = `${firstName} ${lastName}`;
    emailService.sendWelcome({
      to: email,
      name: userName,
      email: email,
      password: userPassword,
      loginUrl: process.env.FRONTEND_URL + '/login'
    }).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;
    delete userObj.refreshToken;

    return userObj;
  }

  async updateUser(id, updateData, institutionId) {
    const query = { _id: id, isActive: true };
    if (institutionId) {
      query.institution = institutionId;
    }
    const user = await User.findOne(query);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Handle email change - check for duplicates
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email, _id: { $ne: id } });
      if (existingUser) {
        throw ApiError.conflict('Email already in use by another user');
      }
      user.email = updateData.email;
    }
    
    // Don't allow password change through this endpoint
    delete updateData.password;

    // Handle profile updates
    if (updateData.profile) {
      user.profile = {
        ...user.profile,
        firstName: updateData.profile.firstName || user.profile?.firstName,
        lastName: updateData.profile.lastName || user.profile?.lastName,
        phone: updateData.profile.phone || user.profile?.phone,
        gender: updateData.profile.gender || user.profile?.gender,
        dateOfBirth: updateData.profile.dateOfBirth || user.profile?.dateOfBirth,
        address: updateData.profile.address || user.profile?.address
      };
    }

    // Handle role change
    if (updateData.role && updateData.role !== user.role) {
      user.role = updateData.role;
    }

    // Handle role-specific profile updates
    if (updateData.teacherProfile) {
      user.teacherData = {
        ...user.teacherData,
        employeeId: updateData.teacherProfile.employeeId || user.teacherData?.employeeId,
        department: updateData.teacherProfile.department || user.teacherData?.department,
        qualification: updateData.teacherProfile.qualifications || user.teacherData?.qualification
      };
    }

    if (updateData.studentProfile) {
      user.studentData = {
        ...user.studentData,
        admissionNumber: updateData.studentProfile.admissionNumber || user.studentData?.admissionNumber,
        rollNumber: updateData.studentProfile.rollNumber || user.studentData?.rollNumber,
        class: updateData.studentProfile.class || user.studentData?.class,
        section: updateData.studentProfile.section || user.studentData?.section
      };
    }

    if (updateData.staffProfile) {
      user.staffData = {
        ...user.staffData,
        employeeId: updateData.staffProfile.employeeId || user.staffData?.employeeId,
        department: updateData.staffProfile.department || user.staffData?.department,
        designation: updateData.staffProfile.designation || user.staffData?.designation
      };
    }

    if (updateData.parentProfile) {
      const oldChildren = user.parentData?.children || [];
      const newChildren = updateData.parentProfile.children || [];
      
      // Update parent data
      user.parentData = {
        ...user.parentData,
        relation: updateData.parentProfile.relation || user.parentData?.relation,
        children: newChildren
      };

      // Remove parent reference from students no longer linked
      const removedChildren = oldChildren.filter(c => !newChildren.includes(c.toString()));
      if (removedChildren.length > 0) {
        await User.updateMany(
          { _id: { $in: removedChildren }, role: 'student' },
          { $unset: { 'studentData.parent': 1 } }
        );
      }

      // Add parent reference to newly linked students
      const addedChildren = newChildren.filter(c => !oldChildren.map(o => o.toString()).includes(c));
      if (addedChildren.length > 0) {
        await User.updateMany(
          { _id: { $in: addedChildren }, role: 'student' },
          { $set: { 'studentData.parent': user._id } }
        );
      }
    }

    if (updateData.isActive !== undefined) {
      user.isActive = updateData.isActive;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;
    delete userObj.refreshToken;

    return userObj;
  }

  async deleteUser(id, institutionId) {
    const query = { _id: id };
    if (institutionId) {
      query.institution = institutionId;
    }
    const user = await User.findOne(query);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    return { message: 'User deleted successfully' };
  }

  async getUsersByRole(role, institutionId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const query = {
      role,
      institution: institutionId,
      isActive: true
    };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('profile.firstName profile.lastName email profile.phone')
        .sort({ 'profile.firstName': 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    return {
      data: users,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Only allow specific fields to be updated
    const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address', 'avatar'];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    Object.assign(user, filteredData);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;

    return userObj;
  }

  async bulkImportUsers(usersData, institutionId, createdBy, creatorRole) {
    const results = {
      successful: [],
      failed: [],
      total: usersData.length
    };

    for (const userData of usersData) {
      try {
        // Check if email already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          results.failed.push({
            email: userData.email,
            error: 'Email already exists'
          });
          continue;
        }

        // Generate password
        const password = generatePassword();

        // Build user object
        const newUser = {
          email: userData.email,
          password,
          role: userData.role,
          institution: institutionId,
          profile: userData.profile,
          createdBy,
          isActive: true,
          isEmailVerified: false,
          mustChangePassword: true
        };

        // Add role-specific data
        if (userData.role === 'student' && userData.studentData) {
          newUser.studentData = userData.studentData;
        }
        if (userData.role === 'teacher' && userData.teacherData) {
          newUser.teacherData = userData.teacherData;
        }
        if (userData.role === 'parent' && userData.parentData) {
          newUser.parentData = userData.parentData;
        }
        if (userData.role === 'staff' && userData.staffData) {
          newUser.staffData = userData.staffData;
        }

        const user = await User.create(newUser);
        results.successful.push({
          email: user.email,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          temporaryPassword: password
        });
      } catch (error) {
        results.failed.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    return results;
  }

  async exportUsers(filters, institutionId) {
    const query = { isActive: true };
    
    if (institutionId) {
      query.institution = institutionId;
    }
    
    if (filters.role && filters.role !== 'all') {
      query.role = filters.role;
    }

    const users = await User.find(query)
      .select('-password -__v -refreshToken -passwordResetToken -passwordResetExpires')
      .lean();

    return users;
  }

  /**
   * Get next admission number for a new student
   * @param {string} institutionId - Institution ID
   * @returns {Promise<object>} - Next admission number and format info
   */
  async getNextAdmissionNumber(institutionId) {
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      throw ApiError.notFound('Institution not found');
    }

    // Get settings or use defaults
    const settings = institution.config?.studentNumbering || {};
    const format = settings.admissionNumberFormat || '{CODE}{YEAR}';
    const padding = settings.admissionNumberPadding || 3;

    // Count existing students in this institution
    const studentCount = await User.countDocuments({
      institution: institutionId,
      role: 'student',
      isActive: true
    });

    const nextNumber = studentCount + 1;
    const year = new Date().getFullYear();
    const paddedNumber = String(nextNumber).padStart(padding, '0');

    // Replace placeholders in format
    let admissionNumber = format
      .replace('{CODE}', institution.code)
      .replace('{YEAR}', year)
      .replace('{YY}', String(year).slice(-2));
    
    // Append the number
    admissionNumber += paddedNumber;

    return {
      admissionNumber,
      format,
      nextNumber,
      institutionCode: institution.code
    };
  }

  /**
   * Get next roll number for a class/section
   * @param {string} institutionId - Institution ID
   * @param {string} classId - Class ID
   * @param {string} sectionId - Section ID (optional)
   * @returns {Promise<object>} - Next roll number
   */
  async getNextRollNumber(institutionId, classId, sectionId) {
    if (!classId) {
      throw ApiError.badRequest('Class ID is required');
    }

    const query = {
      institution: institutionId,
      role: 'student',
      isActive: true,
      'studentData.class': classId
    };

    // If section is provided, filter by section as well
    if (sectionId) {
      query['studentData.section'] = sectionId;
    }

    const studentCount = await User.countDocuments(query);
    const nextRollNumber = studentCount + 1;

    return {
      rollNumber: String(nextRollNumber),
      currentCount: studentCount,
      classId,
      sectionId
    };
  }

  /**
   * Get student numbering settings for an institution
   * @param {string} institutionId - Institution ID
   * @returns {Promise<object>} - Numbering settings
   */
  async getStudentNumberingSettings(institutionId) {
    const institution = await Institution.findById(institutionId)
      .select('code config.studentNumbering');
    
    if (!institution) {
      throw ApiError.notFound('Institution not found');
    }

    const defaults = {
      admissionNumberFormat: '{CODE}{YEAR}',
      admissionNumberPadding: 3,
      rollNumberAutoGenerate: true
    };

    return {
      institutionCode: institution.code,
      settings: institution.config?.studentNumbering || defaults
    };
  }

  /**
   * Update student numbering settings for an institution
   * @param {string} institutionId - Institution ID
   * @param {object} settings - New settings
   * @returns {Promise<object>} - Updated settings
   */
  async updateStudentNumberingSettings(institutionId, settings) {
    const institution = await Institution.findById(institutionId);
    
    if (!institution) {
      throw ApiError.notFound('Institution not found');
    }

    if (!institution.config) {
      institution.config = {};
    }

    institution.config.studentNumbering = {
      ...institution.config.studentNumbering,
      ...settings
    };

    await institution.save();

    return institution.config.studentNumbering;
  }
}

module.exports = new UserService();
