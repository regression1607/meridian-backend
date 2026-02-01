require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Institution = require('../models/Institution');
const logger = require('../utils/logger');

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ role: 'super_admin' });
    if (existingAdmin) {
      logger.info('Super Admin already exists');
      process.exit(0);
    }

    // Create Super Admin
    const superAdmin = await User.create({
      email: 'admin@meridian-ems.com',
      password: 'Admin@123456',
      role: 'super_admin',
      profile: {
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+91-9999999999'
      },
      isEmailVerified: true,
      mustChangePassword: false,
      isActive: true
    });

    logger.info(`
    ╔═══════════════════════════════════════════════════════════╗
    ║         SUPER ADMIN CREATED SUCCESSFULLY                  ║
    ╠═══════════════════════════════════════════════════════════╣
    ║  Email:    admin@meridian-ems.com                        ║
    ║  Password: Admin@123456                                   ║
    ║                                                           ║
    ║  ⚠️  Please change this password immediately!             ║
    ╚═══════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding super admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
