require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Institution = require('../models/Institution');
const logger = require('../utils/logger');

const testUsers = [
  { firstName: 'Emma', lastName: 'Wilson', role: 'student', gender: 'female' },
  { firstName: 'Liam', lastName: 'Johnson', role: 'student', gender: 'male' },
  { firstName: 'Olivia', lastName: 'Brown', role: 'student', gender: 'female' },
  { firstName: 'Noah', lastName: 'Davis', role: 'teacher', gender: 'male' },
  { firstName: 'Ava', lastName: 'Miller', role: 'teacher', gender: 'female' },
  { firstName: 'Sophia', lastName: 'Garcia', role: 'parent', gender: 'female' },
  { firstName: 'James', lastName: 'Martinez', role: 'parent', gender: 'male' },
  { firstName: 'Isabella', lastName: 'Anderson', role: 'staff', gender: 'female' },
  { firstName: 'Lucas', lastName: 'Taylor', role: 'staff', gender: 'male' },
  { firstName: 'Mia', lastName: 'Thomas', role: 'coordinator', gender: 'female' },
];

const seedTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Get first institution
    const institution = await Institution.findOne();
    if (!institution) {
      logger.error('No institution found. Run seed.js first.');
      process.exit(1);
    }

    logger.info(`Adding test users to: ${institution.name}`);

    const createdUsers = [];
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      const email = `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@test.meridian.com`;
      
      // Check if user already exists
      const exists = await User.findOne({ email });
      if (exists) {
        logger.info(`User ${email} already exists, skipping...`);
        continue;
      }

      const newUser = await User.create({
        email,
        password: 'Test@123',
        role: user.role,
        institution: institution._id,
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: `+91-98765${43300 + i}`,
          gender: user.gender
        },
        isEmailVerified: true,
        mustChangePassword: true,
        isActive: true
      });

      createdUsers.push(newUser);
      logger.info(`Created: ${newUser.email} (${newUser.role})`);
    }

    logger.info(`
    ╔═══════════════════════════════════════════════════════════════════╗
    ║              TEST USERS CREATED SUCCESSFULLY                      ║
    ╠═══════════════════════════════════════════════════════════════════╣
    ║  Created ${createdUsers.length} test users                                         ║
    ║  Password for all: Test@123                                       ║
    ║                                                                   ║
    ║  Roles breakdown:                                                 ║
    ║  - Students: 3                                                    ║
    ║  - Teachers: 2                                                    ║
    ║  - Parents: 2                                                     ║
    ║  - Staff: 2                                                       ║
    ║  - Coordinator: 1                                                 ║
    ╚═══════════════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding test users:', error);
    process.exit(1);
  }
};

seedTestUsers();
