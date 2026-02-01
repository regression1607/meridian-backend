const Institution = require('../models/Institution');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

class InstitutionService {
  async getInstitutions(filters = {}, options = {}) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = options;
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    const [institutions, total] = await Promise.all([
      Institution.find(query)
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Institution.countDocuments(query)
    ]);

    return {
      data: institutions,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getInstitutionById(id) {
    const institution = await Institution.findById(id);
    if (!institution) {
      throw ApiError.notFound('Institution not found');
    }
    return institution;
  }

  async createInstitution(data) {
    const { name, code, type, email, phone, website, address } = data;

    // Check if code already exists
    if (code) {
      const existing = await Institution.findOne({ code: code.toUpperCase() });
      if (existing) {
        throw ApiError.conflict('Institution code already exists');
      }
    }

    // Generate code if not provided
    const institutionCode = code || this.generateCode(name);

    // Set default address if not fully provided
    const institutionAddress = {
      street: address?.street || 'To be updated',
      city: address?.city || 'To be updated',
      state: address?.state || 'To be updated',
      zipCode: address?.zipCode || '000000',
      country: address?.country || 'India'
    };

    const institution = await Institution.create({
      name,
      code: institutionCode.toUpperCase(),
      type: type || 'secondary',
      email,
      phone,
      website,
      address: institutionAddress,
      subscription: {
        plan: 'free', // Start with free plan
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        maxStudents: 100,
        maxStaff: 20
      },
      isActive: true
    });

    return institution;
  }

  generateCode(name) {
    const prefix = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
  }

  async getInstitutionStats(institutionId) {
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalStaff
    ] = await Promise.all([
      User.countDocuments({ institution: institutionId, role: 'student', isActive: true }),
      User.countDocuments({ institution: institutionId, role: 'teacher', isActive: true }),
      User.countDocuments({ institution: institutionId, role: 'parent', isActive: true }),
      User.countDocuments({ institution: institutionId, role: 'staff', isActive: true })
    ]);

    return {
      totalStudents,
      totalTeachers,
      totalParents,
      totalStaff,
      totalUsers: totalStudents + totalTeachers + totalParents + totalStaff
    };
  }

  async updateInstitution(id, updateData) {
    const institution = await Institution.findById(id);
    if (!institution) {
      throw ApiError.notFound('Institution not found');
    }

    // Fields that can be updated
    const allowedFields = [
      'name', 'email', 'phone', 'website', 'address', 
      'branding', 'features', 'config', 'academicYearStart',
      'subscription', 'isActive'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'subscription') {
          // Merge subscription updates
          institution.subscription = {
            ...institution.subscription?.toObject?.() || institution.subscription || {},
            ...updateData.subscription
          };
          // Update limits based on plan
          const planLimits = {
            free: { maxStudents: 100, maxStaff: 20 },
            basic: { maxStudents: 500, maxStaff: 50 },
            premium: { maxStudents: 2000, maxStaff: 200 },
            enterprise: { maxStudents: 999999, maxStaff: 99999 }
          };
          if (updateData.subscription.plan && planLimits[updateData.subscription.plan]) {
            institution.subscription.maxStudents = planLimits[updateData.subscription.plan].maxStudents;
            institution.subscription.maxStaff = planLimits[updateData.subscription.plan].maxStaff;
          }
        } else if (field === 'address') {
          // Merge address updates
          institution.address = {
            ...institution.address?.toObject?.() || institution.address || {},
            ...updateData.address
          };
        } else {
          institution[field] = updateData[field];
        }
      }
    });

    await institution.save();
    return institution;
  }

  async getDashboardStats(institutionId) {
    const stats = await this.getInstitutionStats(institutionId);
    
    // Get recent activity counts (last 7 days)
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [newStudents, newTeachers] = await Promise.all([
      User.countDocuments({ 
        institution: institutionId, 
        role: 'student', 
        createdAt: { $gte: lastWeek } 
      }),
      User.countDocuments({ 
        institution: institutionId, 
        role: 'teacher', 
        createdAt: { $gte: lastWeek } 
      })
    ]);

    return {
      ...stats,
      recentActivity: {
        newStudents,
        newTeachers,
        period: '7 days'
      }
    };
  }

  // Public endpoint - returns only active institutions with basic info
  async getPublicInstitutions() {
    const institutions = await Institution.find({ isActive: true })
      .select('_id name code type address.city')
      .sort({ name: 1 })
      .lean();
    return institutions;
  }
}

module.exports = new InstitutionService();
