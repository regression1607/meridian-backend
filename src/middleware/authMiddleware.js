const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const { ROLE_HIERARCHY } = require('../config/constants');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'Not authorized, no token provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Debug: Log JWT token data on each request
      // console.log('\n🔐 [JWT DEBUG]', {
      //   endpoint: `${req.method} ${req.originalUrl}`,
      //   tokenData: {
      //     userId: decoded.id,
      //     role: decoded.role,
      //     institutionId: decoded.institution || 'N/A (Platform Admin)',
      //     issuedAt: new Date(decoded.iat * 1000).toISOString(),
      //     expiresAt: new Date(decoded.exp * 1000).toISOString()
      //   }
      // });
      
      const user = await User.findById(decoded.id)
        .select('-password')
        .populate('institution', 'name code type');

      if (!user) {
        return ApiResponse.unauthorized(res, 'User not found');
      }

      if (!user.isActive) {
        return ApiResponse.unauthorized(res, 'Account is deactivated');
      }

      // Debug: Log user data from DB
      // console.log('👤 [USER DEBUG]', {
      //   email: user.email,
      //   role: user.role,
      //   institutionId: user.institution?._id || 'N/A (Platform Admin)',
      //   institutionName: user.institution?.name || 'N/A'
      // });

      req.user = user;
      next();
    } catch (error) {
      return ApiResponse.unauthorized(res, 'Not authorized, token failed');
    }
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, `Role '${req.user.role}' is not authorized to access this resource`);
    }
    next();
  };
};

const authorizeMinRole = (minRole) => {
  return (req, res, next) => {
    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userRoleLevel < requiredLevel) {
      return ApiResponse.forbidden(res, 'You do not have sufficient permissions');
    }
    next();
  };
};

const sameInstitution = async (req, res, next) => {
  try {
    const resourceInstitution = req.params.institutionId || req.body.institution;
    
    // Super admin and admin can access all institutions
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      return next();
    }

    if (resourceInstitution && req.user.institution.toString() !== resourceInstitution.toString()) {
      return ApiResponse.forbidden(res, 'You can only access resources from your institution');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is super admin or admin (platform level)
const isPlatformAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, 'Only platform administrators can access this resource');
  }
  next();
};

module.exports = { protect, authorize, authorizeMinRole, sameInstitution, isPlatformAdmin };
