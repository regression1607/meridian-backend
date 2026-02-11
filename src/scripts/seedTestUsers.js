require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Section = require('../models/Section');
const logger = require('../utils/logger');

// ============== CONFIGURATION ==============
const INSTITUTION_ID = '69838e8017186b2e9dba33b2';
const STUDENT_COUNT = 100;
const PARENT_COUNT = 100;
const TEACHER_COUNT = 20;
const START_INDEX = 4000; // Change this to add more users without duplicates
// ===========================================

// Name pools for generating realistic names
const maleFirstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Advait', 'Aarush', 'Kabir', 'Ritvik', 'Darsh', 'Veer',
  'Dhruv', 'Arnav', 'Rudra', 'Yash', 'Rohan', 'Nikhil', 'Kunal', 'Rahul', 'Amit', 'Vikram',
  'Raj', 'Dev', 'Om', 'Karan', 'Ansh', 'Laksh', 'Parth', 'Harsh', 'Mohit', 'Sahil',
  'Aryan', 'Siddharth', 'Tanmay', 'Abhinav', 'Akash', 'Varun', 'Rishabh', 'Manav', 'Gaurav', 'Aakash'
];

const femaleFirstNames = [
  'Saanvi', 'Aanya', 'Aadhya', 'Aaradhya', 'Ananya', 'Pari', 'Anika', 'Navya', 'Angel', 'Diya',
  'Myra', 'Sara', 'Iraa', 'Ahana', 'Anvi', 'Prisha', 'Riya', 'Aarohi', 'Anushka', 'Kavya',
  'Ishita', 'Kiara', 'Nisha', 'Pooja', 'Priya', 'Neha', 'Shruti', 'Divya', 'Anjali', 'Meera',
  'Tanvi', 'Kritika', 'Sanya', 'Aishwarya', 'Avni', 'Bhavya', 'Charvi', 'Dia', 'Eva', 'Gauri',
  'Ira', 'Jiya', 'Khushi', 'Lavanya', 'Mahi', 'Naina', 'Pihu', 'Riddhi', 'Sana', 'Tara'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Rao', 'Nair', 'Menon',
  'Iyer', 'Pillai', 'Joshi', 'Desai', 'Shah', 'Mehta', 'Chopra', 'Kapoor', 'Malhotra', 'Bhatia',
  'Agarwal', 'Bansal', 'Saxena', 'Srivastava', 'Mishra', 'Pandey', 'Tiwari', 'Dubey', 'Chauhan', 'Yadav',
  'Thakur', 'Rajput', 'Rathore', 'Choudhary', 'Jain', 'Goyal', 'Mittal', 'Khanna', 'Sethi', 'Arora'
];

const generateUsers = (count, role, startIndex) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5;
    const firstNames = isMale ? maleFirstNames : femaleFirstNames;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const uniqueSuffix = startIndex + i;
    
    users.push({
      firstName,
      lastName,
      role,
      gender: isMale ? 'male' : 'female',
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${uniqueSuffix}@test.meridian.com`,
      phone: `+91-${9000000000 + uniqueSuffix}`,
      uniqueSuffix
    });
  }
  return users;
};

const seedTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    logger.info(`Seeding users for institution: ${INSTITUTION_ID}`);

    // Fetch classes and their sections for this institution
    const classes = await Class.find({ institution: INSTITUTION_ID, isActive: true })
      .populate('sections')
      .lean();

    if (classes.length === 0) {
      logger.warn('No classes found for this institution. Students will be created without class assignment.');
    } else {
      logger.info(`Found ${classes.length} classes`);
    }

    // Build class-section pairs for distribution
    const classSectionPairs = [];
    for (const cls of classes) {
      if (cls.sections && cls.sections.length > 0) {
        for (const section of cls.sections) {
          classSectionPairs.push({ classId: cls._id, sectionId: section._id, className: cls.name, sectionName: section.name });
        }
      } else {
        classSectionPairs.push({ classId: cls._id, sectionId: null, className: cls.name, sectionName: null });
      }
    }

    // Track roll numbers per class-section
    const rollNumberCounters = {};
    for (const pair of classSectionPairs) {
      const key = `${pair.classId}-${pair.sectionId || 'none'}`;
      // Get existing max roll number for this class-section
      const existingStudents = await User.find({
        institution: INSTITUTION_ID,
        role: 'student',
        'studentData.class': pair.classId,
        'studentData.section': pair.sectionId
      }).select('studentData.rollNumber').lean();
      
      let maxRoll = 0;
      for (const s of existingStudents) {
        const rollNum = parseInt(s.studentData?.rollNumber) || 0;
        if (rollNum > maxRoll) maxRoll = rollNum;
      }
      rollNumberCounters[key] = maxRoll;
    }

    // Generate users
    const students = generateUsers(STUDENT_COUNT, 'student', START_INDEX);
    const parents = generateUsers(PARENT_COUNT, 'parent', START_INDEX + STUDENT_COUNT);
    const teachers = generateUsers(TEACHER_COUNT, 'teacher', START_INDEX + STUDENT_COUNT + PARENT_COUNT);

    const allUsers = [...students, ...parents, ...teachers];
    
    let createdCount = { student: 0, parent: 0, teacher: 0 };
    let skippedCount = 0;

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      
      // Check if user already exists
      const exists = await User.findOne({ email: user.email });
      if (exists) {
        skippedCount++;
        continue;
      }

      const userData = {
        email: user.email,
        password: 'Test@123',
        role: user.role,
        institution: INSTITUTION_ID,
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          gender: user.gender
        },
        isEmailVerified: true,
        mustChangePassword: true,
        isActive: true
      };

      // Add role-specific data
      if (user.role === 'student') {
        // Assign class and section (distribute evenly)
        let classId = null;
        let sectionId = null;
        let rollNumber = null;

        if (classSectionPairs.length > 0) {
          const pairIndex = createdCount.student % classSectionPairs.length;
          const pair = classSectionPairs[pairIndex];
          classId = pair.classId;
          sectionId = pair.sectionId;
          
          // Increment and get roll number
          const key = `${classId}-${sectionId || 'none'}`;
          rollNumberCounters[key] = (rollNumberCounters[key] || 0) + 1;
          rollNumber = String(rollNumberCounters[key]).padStart(2, '0');
        }

        userData.studentData = {
          admissionNumber: `STU${user.uniqueSuffix}`,
          rollNumber: rollNumber,
          class: classId,
          section: sectionId,
          admissionDate: new Date()
        };
      } else if (user.role === 'teacher') {
        userData.teacherData = {
          employeeId: `TCH${user.uniqueSuffix}`,
          joiningDate: new Date()
        };
      } else if (user.role === 'parent') {
        userData.parentData = {
          relation: Math.random() > 0.5 ? 'father' : 'mother'
        };
      }

      await User.create(userData);
      createdCount[user.role]++;
      
      if ((createdCount.student + createdCount.parent + createdCount.teacher) % 20 === 0) {
        logger.info(`Progress: ${createdCount.student} students, ${createdCount.parent} parents, ${createdCount.teacher} teachers`);
      }
    }

    const total = createdCount.student + createdCount.parent + createdCount.teacher;

    logger.info(`
    ╔═══════════════════════════════════════════════════════════════════╗
    ║              TEST USERS SEEDED SUCCESSFULLY                       ║
    ╠═══════════════════════════════════════════════════════════════════╣
    ║  Institution: ${INSTITUTION_ID}                      ║
    ║                                                                   ║
    ║  Created: ${total} users (Skipped: ${skippedCount} existing)                        ║
    ║  Password for all: Test@123                                       ║
    ║                                                                   ║
    ║  Breakdown:                                                       ║
    ║  - Students: ${createdCount.student} (with class/section/roll assigned)               ║
    ║  - Parents:  ${createdCount.parent}                                                    ║
    ║  - Teachers: ${createdCount.teacher}                                                     ║
    ║                                                                   ║
    ║  Classes found: ${classes.length}                                                   ║
    ║  Class-Section pairs: ${classSectionPairs.length}                                            ║
    ║                                                                   ║
    ║  To add more users, increase START_INDEX (currently ${START_INDEX})           ║
    ╚═══════════════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding test users:', error);
    process.exit(1);
  }
};

seedTestUsers();
