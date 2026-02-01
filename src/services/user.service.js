const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { generatePassword } = require('../utils/helpers');

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
    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      query.$or = [
        { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
        { 'profile.lastName': { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -__v -refreshToken')
        .populate('institution', 'name code')
        .sort({ [sort]: sortOrder })
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
        relation: parentProfile.relation
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

    // TODO: Send welcome email with credentials

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

    // Don't allow email change through this endpoint
    delete updateData.email;
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
}

module.exports = new UserService();
