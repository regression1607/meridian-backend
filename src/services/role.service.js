const Role = require('../models/Role');
const ApiError = require('../utils/apiError');

class RoleService {
  // Create default roles for an institution
  async createDefaultRoles(institutionId, createdBy) {
    const defaultRoles = Role.getDefaultRolesTemplate();
    const roles = [];

    for (const roleTemplate of defaultRoles) {
      const existingRole = await Role.findOne({
        slug: roleTemplate.slug,
        institution: institutionId
      });

      if (!existingRole) {
        const role = await Role.create({
          ...roleTemplate,
          institution: institutionId,
          createdBy
        });
        roles.push(role);
      }
    }

    return roles;
  }

  // Get all roles for an institution
  async getRoles(institutionId, options = {}) {
    const { page = 1, limit = 50, search, isActive } = options;
    const skip = (page - 1) * limit;

    const query = { institution: institutionId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    const [roles, total] = await Promise.all([
      Role.find(query)
        .sort({ isDefault: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'profile.firstName profile.lastName'),
      Role.countDocuments(query)
    ]);

    return {
      data: roles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get role by ID
  async getRoleById(roleId, institutionId) {
    const role = await Role.findOne({
      _id: roleId,
      institution: institutionId
    }).populate('createdBy', 'profile.firstName profile.lastName');

    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    return role;
  }

  // Get role by slug
  async getRoleBySlug(slug, institutionId) {
    const role = await Role.findOne({
      slug,
      institution: institutionId
    });

    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    return role;
  }

  // Create a new role
  async createRole(data, institutionId, createdBy) {
    // Check if role with same name exists
    const existingRole = await Role.findOne({
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      institution: institutionId
    });

    if (existingRole) {
      throw ApiError.conflict('A role with this name already exists');
    }

    const role = await Role.create({
      ...data,
      institution: institutionId,
      createdBy,
      isDefault: false // Custom roles are never default
    });

    return role;
  }

  // Update a role
  async updateRole(roleId, data, institutionId) {
    const role = await Role.findOne({
      _id: roleId,
      institution: institutionId
    });

    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    // Don't allow changing the slug of default roles
    if (role.isDefault && data.name && data.name !== role.name) {
      throw ApiError.badRequest('Cannot change the name of default roles');
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== role.name) {
      const newSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const existingRole = await Role.findOne({
        slug: newSlug,
        institution: institutionId,
        _id: { $ne: roleId }
      });

      if (existingRole) {
        throw ApiError.conflict('A role with this name already exists');
      }
    }

    // Update fields
    Object.assign(role, data);
    await role.save();

    return role;
  }

  // Update role permissions
  async updateRolePermissions(roleId, permissions, institutionId) {
    const role = await Role.findOne({
      _id: roleId,
      institution: institutionId
    });

    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    // Update permissions
    if (permissions.modules) {
      for (const [module, perms] of Object.entries(permissions.modules)) {
        if (role.permissions[module]) {
          Object.assign(role.permissions[module], perms);
        }
      }
    }

    if (permissions.special) {
      Object.assign(role.specialPermissions, permissions.special);
    }

    await role.save();
    return role;
  }

  // Delete a role
  async deleteRole(roleId, institutionId) {
    const role = await Role.findOne({
      _id: roleId,
      institution: institutionId
    });

    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    if (role.isDefault) {
      throw ApiError.badRequest('Cannot delete default roles');
    }

    // Check if any users are assigned this role
    const User = require('../models/User');
    const usersWithRole = await User.countDocuments({
      customRole: roleId,
      institution: institutionId
    });

    if (usersWithRole > 0) {
      throw ApiError.badRequest(`Cannot delete role. ${usersWithRole} user(s) are assigned this role.`);
    }

    await role.deleteOne();
    return { message: 'Role deleted successfully' };
  }

  // Clone a role
  async cloneRole(roleId, newName, institutionId, createdBy) {
    const sourceRole = await Role.findOne({
      _id: roleId,
      institution: institutionId
    });

    if (!sourceRole) {
      throw ApiError.notFound('Source role not found');
    }

    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const existingRole = await Role.findOne({
      slug: newSlug,
      institution: institutionId
    });

    if (existingRole) {
      throw ApiError.conflict('A role with this name already exists');
    }

    const newRole = await Role.create({
      name: newName,
      slug: newSlug,
      description: `Cloned from ${sourceRole.name}`,
      institution: institutionId,
      isDefault: false,
      isActive: true,
      permissions: sourceRole.permissions,
      specialPermissions: sourceRole.specialPermissions,
      createdBy
    });

    return newRole;
  }

  // Get users by role
  async getUsersByRole(roleId, institutionId, options = {}) {
    const User = require('../models/User');
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const role = await this.getRoleById(roleId, institutionId);

    const query = {
      institution: institutionId,
      $or: [
        { customRole: roleId },
        { role: role.slug }
      ]
    };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('profile.firstName profile.lastName email role customRole isActive')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get permissions for a user based on their role
  async getUserPermissions(userId, institutionId) {
    const User = require('../models/User');
    const user = await User.findById(userId).populate('customRole');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // If user has a custom role, use that
    if (user.customRole) {
      return {
        role: user.customRole,
        permissions: user.customRole.permissions,
        specialPermissions: user.customRole.specialPermissions
      };
    }

    // Otherwise, find the default role by slug
    const role = await Role.findOne({
      slug: user.role,
      institution: institutionId
    });

    if (role) {
      return {
        role,
        permissions: role.permissions,
        specialPermissions: role.specialPermissions
      };
    }

    // Return empty permissions if no role found
    return {
      role: null,
      permissions: {},
      specialPermissions: {}
    };
  }
}

module.exports = new RoleService();
