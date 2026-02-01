require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Institution = require('../models/Institution');
const logger = require('../utils/logger');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check if data already exists
    const institutionCount = await Institution.countDocuments();
    if (institutionCount > 0) {
      logger.info('Database already seeded. Skipping...');
      process.exit(0);
    }

    // Create Demo Institution
    const demoInstitution = await Institution.create({
      name: 'Meridian Demo School',
      code: 'MDS001',
      type: 'secondary',
      email: 'demo@meridian-ems.com',
      phone: '+91-9876543210',
      website: 'https://demo.meridian-ems.com',
      address: {
        street: '123 Education Street',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560001'
      },
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF'
      },
      features: {
        parentPortal: true,
        onlinePayment: true,
        smsNotifications: true,
        aiFeatures: true,
        library: true,
        transport: true,
        hostel: true
      },
      subscription: {
        plan: 'premium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxStudents: 5000,
        maxStaff: 500
      }
    });

    logger.info(`Created Demo Institution: ${demoInstitution.name}`);

    // Create Platform Admin (created by super_admin to manage institutions)
    const platformAdmin = await User.create({
      email: 'admin@meridian-ems.com',
      password: 'Admin@123',
      role: 'admin',
      profile: {
        firstName: 'Platform',
        lastName: 'Admin',
        phone: '+91-9876543200',
        gender: 'male'
      },
      isEmailVerified: true,
      mustChangePassword: false,
      isActive: true
    });

    logger.info(`Created Platform Admin: ${platformAdmin.email}`);

    // Create Institution Admin
    const institutionAdmin = await User.create({
      email: 'principal@demo.meridian-ems.com',
      password: 'Principal@123',
      role: 'institution_admin',
      institution: demoInstitution._id,
      profile: {
        firstName: 'John',
        lastName: 'Principal',
        phone: '+91-9876543211',
        gender: 'male'
      },
      isEmailVerified: true,
      mustChangePassword: true,
      isActive: true
    });

    // Create Demo Teacher
    const demoTeacher = await User.create({
      email: 'teacher@demo.meridian-ems.com',
      password: 'Teacher@123',
      role: 'teacher',
      institution: demoInstitution._id,
      profile: {
        firstName: 'Sarah',
        lastName: 'Teacher',
        phone: '+91-9876543212',
        gender: 'female'
      },
      teacherData: {
        employeeId: 'TCH001',
        qualification: 'M.Ed',
        experience: 5,
        joiningDate: new Date('2020-06-01')
      },
      isEmailVerified: true,
      mustChangePassword: true,
      isActive: true
    });

    // Create Demo Student
    const demoStudent = await User.create({
      email: 'student@demo.meridian-ems.com',
      password: 'Student@123',
      role: 'student',
      institution: demoInstitution._id,
      profile: {
        firstName: 'Alex',
        lastName: 'Student',
        phone: '+91-9876543213',
        gender: 'male',
        dateOfBirth: new Date('2010-05-15')
      },
      studentData: {
        admissionNumber: 'ADM2024001',
        rollNumber: '001',
        admissionDate: new Date('2024-04-01'),
        bloodGroup: 'O+'
      },
      isEmailVerified: true,
      mustChangePassword: true,
      isActive: true
    });

    // Create Demo Parent
    const demoParent = await User.create({
      email: 'parent@demo.meridian-ems.com',
      password: 'Parent@123',
      role: 'parent',
      institution: demoInstitution._id,
      profile: {
        firstName: 'David',
        lastName: 'Parent',
        phone: '+91-9876543214',
        gender: 'male'
      },
      parentData: {
        occupation: 'Engineer',
        children: [demoStudent._id],
        relation: 'father'
      },
      isEmailVerified: true,
      mustChangePassword: true,
      isActive: true
    });

    // Update student with parent reference
    await User.findByIdAndUpdate(demoStudent._id, {
      'studentData.parent': demoParent._id
    });

    logger.info(`
    ╔═══════════════════════════════════════════════════════════════════╗
    ║              DATABASE SEEDED SUCCESSFULLY                         ║
    ╠═══════════════════════════════════════════════════════════════════╣
    ║                                                                   ║
    ║  PLATFORM ADMIN (manages all institutions)                        ║
    ║  ─────────────────────────────────────────                        ║
    ║  Admin:      admin@meridian-ems.com           (Admin@123)         ║
    ║                                                                   ║
    ║  DEMO INSTITUTION                                                 ║
    ║  ─────────────────                                                ║
    ║  Name: Meridian Demo School                                       ║
    ║  Code: MDS001                                                     ║
    ║                                                                   ║
    ║  DEMO ACCOUNTS (Password: [Role]@123)                             ║
    ║  ─────────────────────────────────────                            ║
    ║  Principal:  principal@demo.meridian-ems.com  (Principal@123)     ║
    ║  Teacher:    teacher@demo.meridian-ems.com    (Teacher@123)       ║
    ║  Student:    student@demo.meridian-ems.com    (Student@123)       ║
    ║  Parent:     parent@demo.meridian-ems.com     (Parent@123)        ║
    ║                                                                   ║
    ║  ⚠️  These are demo accounts. Change passwords in production!     ║
    ╚═══════════════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
