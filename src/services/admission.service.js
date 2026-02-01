const { AdmissionApplication, Enrollment, APPLICATION_STATUS } = require('../models/Admission');
const Counter = require('../models/Counter');
const User = require('../models/User');
const Class = require('../models/Class');
const Section = require('../models/Section');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../config/constants');

class AdmissionService {
  
  // Submit a new application (public)
  async submitApplication(applicationData, institutionId) {
    const year = new Date().getFullYear();
    const academicYear = applicationData.academicYear || `${year}-${(year + 1).toString().slice(-2)}`;
    
    // Generate application number atomically using Counter model to prevent duplicates
    const applicationNumber = await Counter.generateApplicationNumber(institutionId, academicYear);
    
    // Extract only the fields we need, excluding any MongoDB reserved fields
    const {
      _id,                    // Exclude - MongoDB auto-generates
      institutionId: _instId, // Exclude - we use the parameter instead
      institution: _inst,     // Exclude - we set this explicitly
      applicationNumber: _appNum, // Exclude - we generate this
      status: _status,        // Exclude - we set this explicitly
      statusHistory: _history, // Exclude - we set this explicitly
      createdAt,              // Exclude - MongoDB auto-generates
      updatedAt,              // Exclude - MongoDB auto-generates
      __v,                    // Exclude - MongoDB version key
      ...safeApplicationData
    } = applicationData;
    
    const application = new AdmissionApplication({
      ...safeApplicationData,
      institution: institutionId,
      academicYear,
      applicationNumber,
      status: APPLICATION_STATUS.SUBMITTED,
      statusHistory: [{
        status: APPLICATION_STATUS.SUBMITTED,
        changedAt: new Date(),
        remarks: 'Application submitted'
      }]
    });
    
    await application.save();
    
    return application;
  }

  // Get all applications with filters
  async getApplications(institutionId, filters = {}) {
    const { 
      status, 
      academicYear, 
      classId, 
      search,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const query = { 
      institution: institutionId,
      isDeleted: false 
    };

    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;
    if (classId) query.applyingForClass = classId;
    
    if (search) {
      query.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { 'studentInfo.firstName': { $regex: search, $options: 'i' } },
        { 'studentInfo.lastName': { $regex: search, $options: 'i' } },
        { 'fatherInfo.name': { $regex: search, $options: 'i' } },
        { 'fatherInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      AdmissionApplication.find(query)
        .populate('applyingForClass', 'name grade')
        .populate('preferredSection', 'name')
        .populate('reviewedBy', 'profile.firstName profile.lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AdmissionApplication.countDocuments(query)
    ]);

    return {
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get single application
  async getApplicationById(applicationId, institutionId) {
    const application = await AdmissionApplication.findOne({
      _id: applicationId,
      institution: institutionId,
      isDeleted: false
    })
      .populate('applyingForClass', 'name grade')
      .populate('preferredSection', 'name')
      .populate('reviewedBy', 'profile.firstName profile.lastName email')
      .populate('statusHistory.changedBy', 'profile.firstName profile.lastName');

    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    return application;
  }

  // Update application status
  async updateApplicationStatus(applicationId, institutionId, statusData, userId) {
    const { status, remarks } = statusData;
    
    const application = await AdmissionApplication.findOne({
      _id: applicationId,
      institution: institutionId,
      isDeleted: false
    });

    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    // Validate status transition
    const validTransitions = {
      [APPLICATION_STATUS.SUBMITTED]: [APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
      [APPLICATION_STATUS.UNDER_REVIEW]: [APPLICATION_STATUS.DOCUMENT_PENDING, APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED],
      [APPLICATION_STATUS.DOCUMENT_PENDING]: [APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
      [APPLICATION_STATUS.APPROVED]: [APPLICATION_STATUS.ENROLLED, APPLICATION_STATUS.WITHDRAWN],
      [APPLICATION_STATUS.REJECTED]: [],
      [APPLICATION_STATUS.ENROLLED]: [],
      [APPLICATION_STATUS.WITHDRAWN]: []
    };

    if (!validTransitions[application.status]?.includes(status)) {
      throw new ApiError(400, `Cannot change status from ${application.status} to ${status}`);
    }

    application.status = status;
    application.statusHistory.push({
      status,
      changedBy: userId,
      changedAt: new Date(),
      remarks
    });

    if (status === APPLICATION_STATUS.APPROVED || status === APPLICATION_STATUS.REJECTED) {
      application.reviewedBy = userId;
      application.reviewedAt = new Date();
      application.reviewRemarks = remarks;
    }

    await application.save();
    
    return application;
  }

  // Update application details
  async updateApplication(applicationId, institutionId, updateData) {
    const application = await AdmissionApplication.findOneAndUpdate(
      { 
        _id: applicationId, 
        institution: institutionId,
        isDeleted: false,
        status: { $in: [APPLICATION_STATUS.SUBMITTED, APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.DOCUMENT_PENDING] }
      },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!application) {
      throw new ApiError(404, 'Application not found or cannot be modified');
    }

    return application;
  }

  // Enroll student from approved application
  async enrollStudent(applicationId, institutionId, enrollmentData, userId) {
    const application = await AdmissionApplication.findOne({
      _id: applicationId,
      institution: institutionId,
      status: APPLICATION_STATUS.APPROVED,
      isDeleted: false
    }).populate('applyingForClass');

    if (!application) {
      throw new ApiError(404, 'Approved application not found');
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ application: applicationId });
    if (existingEnrollment) {
      throw new ApiError(400, 'Application already enrolled');
    }

    const { 
      sectionId, rollNumber, admissionFeeAmount, admissionFeePaid, remarks, 
      studentEmail: customStudentEmail, studentPassword, 
      parentEmail: customParentEmail, parentPassword 
    } = enrollmentData;

    // Validate required emails
    if (!customStudentEmail) {
      throw new ApiError(400, 'Student email is required');
    }
    if (!customParentEmail) {
      throw new ApiError(400, 'Parent/Guardian email is required');
    }

    // Generate admission number atomically using Counter model to prevent duplicates
    const admissionNumber = await Counter.generateAdmissionNumber(institutionId);

    // Determine parent info based on availability (for profile data)
    let parentName = null;
    let parentPhone = null;
    let parentOccupation = null;
    let parentRelation = 'father';

    // Check both parents deceased -> use guardian
    if (application.fatherInfo?.isDeceased && application.motherInfo?.isDeceased) {
      parentName = application.guardianInfo?.name;
      parentPhone = application.guardianInfo?.phone;
      parentRelation = application.guardianInfo?.relation || 'guardian';
    } else if (application.fatherInfo?.isDeceased) {
      // Father deceased -> use mother
      parentName = application.motherInfo?.name;
      parentPhone = application.motherInfo?.phone;
      parentOccupation = application.motherInfo?.occupation;
      parentRelation = 'mother';
    } else if (application.motherInfo?.isDeceased) {
      // Mother deceased -> use father
      parentName = application.fatherInfo?.name;
      parentPhone = application.fatherInfo?.phone;
      parentOccupation = application.fatherInfo?.occupation;
      parentRelation = 'father';
    } else if (application.primaryContact === 'guardian') {
      parentName = application.guardianInfo?.name;
      parentPhone = application.guardianInfo?.phone;
      parentRelation = application.guardianInfo?.relation || 'guardian';
    } else if (application.primaryContact === 'mother') {
      parentName = application.motherInfo?.name;
      parentPhone = application.motherInfo?.phone;
      parentOccupation = application.motherInfo?.occupation;
      parentRelation = 'mother';
    } else {
      // Default to father
      parentName = application.fatherInfo?.name;
      parentPhone = application.fatherInfo?.phone;
      parentOccupation = application.fatherInfo?.occupation;
      parentRelation = 'father';
    }

    // Use custom email from enrollment form
    const parentEmail = customParentEmail.toLowerCase().trim();

    // Create parent user account
    let parentUser = null;
    // Check if parent already exists
    parentUser = await User.findOne({ email: parentEmail });
    
    if (!parentUser) {
      parentUser = new User({
        email: parentEmail,
        password: parentPassword || 'Parent@123',
        role: ROLES.PARENT,
        institution: institutionId,
        profile: {
          firstName: parentName?.split(' ')[0] || 'Parent',
          lastName: parentName?.split(' ').slice(1).join(' ') || application.studentInfo.lastName,
          phone: parentPhone,
          address: application.address
        },
        parentData: {
          occupation: parentOccupation,
          relation: parentRelation,
          children: []
        },
        isActive: true
      });
      await parentUser.save();
    }

    // Use custom student email from enrollment form
    const studentEmail = customStudentEmail.toLowerCase().trim();
    
    const studentUser = new User({
      email: studentEmail,
      password: studentPassword || 'Student@123',
      role: ROLES.STUDENT,
      institution: institutionId,
      profile: {
        firstName: application.studentInfo.firstName,
        lastName: application.studentInfo.lastName,
        dateOfBirth: application.studentInfo.dateOfBirth,
        gender: application.studentInfo.gender,
        avatar: application.studentInfo.photo,
        address: application.address
      },
      studentData: {
        admissionNumber,
        rollNumber: rollNumber || '',
        class: application.applyingForClass._id,
        section: sectionId || application.preferredSection,
        admissionDate: new Date(),
        bloodGroup: application.studentInfo.bloodGroup,
        parent: parentUser?._id
      },
      isActive: true
    });

    await studentUser.save();

    // Update parent's children array
    if (parentUser) {
      parentUser.parentData.children.push(studentUser._id);
      await parentUser.save();
    }

    // Create enrollment record
    const enrollment = new Enrollment({
      application: applicationId,
      institution: institutionId,
      student: studentUser._id,
      parent: parentUser?._id,
      admissionNumber,
      class: application.applyingForClass._id,
      section: sectionId || application.preferredSection,
      rollNumber,
      admissionFeePaid: admissionFeePaid || false,
      admissionFeeAmount: admissionFeeAmount || 0,
      enrolledBy: userId,
      remarks
    });

    await enrollment.save();

    // Update application status to enrolled
    application.status = APPLICATION_STATUS.ENROLLED;
    application.statusHistory.push({
      status: APPLICATION_STATUS.ENROLLED,
      changedBy: userId,
      changedAt: new Date(),
      remarks: `Enrolled with admission number: ${admissionNumber}`
    });
    await application.save();

    return {
      enrollment,
      student: studentUser,
      parent: parentUser,
      admissionNumber
    };
  }

  // Get enrollment by ID
  async getEnrollmentById(enrollmentId, institutionId) {
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      institution: institutionId,
      isDeleted: false
    })
      .populate('application')
      .populate('student', 'email profile studentData')
      .populate('parent', 'email profile')
      .populate('class', 'name grade')
      .populate('section', 'name')
      .populate('enrolledBy', 'profile.firstName profile.lastName');

    if (!enrollment) {
      throw new ApiError(404, 'Enrollment not found');
    }

    return enrollment;
  }

  // Get all enrollments
  async getEnrollments(institutionId, filters = {}) {
    const { classId, sectionId, academicYear, search, page = 1, limit = 20 } = filters;

    const query = { institution: institutionId, isDeleted: false };
    if (classId) query.class = classId;
    if (sectionId) query.section = sectionId;

    const skip = (page - 1) * limit;

    let enrollments = await Enrollment.find(query)
      .populate('application')
      .populate('student', 'email profile studentData')
      .populate('parent', 'email profile')
      .populate('class', 'name grade')
      .populate('section', 'name')
      .populate('enrolledBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Filter by search if provided (search in student name or admission number)
    if (search) {
      const searchLower = search.toLowerCase();
      enrollments = enrollments.filter(e => 
        e.admissionNumber?.toLowerCase().includes(searchLower) ||
        e.student?.profile?.firstName?.toLowerCase().includes(searchLower) ||
        e.student?.profile?.lastName?.toLowerCase().includes(searchLower)
      );
    }

    const total = await Enrollment.countDocuments(query);

    return {
      enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get admission statistics
  async getAdmissionStats(institutionId, academicYear) {
    const mongoose = require('mongoose');
    
    // Convert institutionId to ObjectId for aggregation
    const instId = new mongoose.Types.ObjectId(institutionId);
    
    // Build base query - academicYear filter is optional
    // Use $ne: true for isDeleted to handle documents where field doesn't exist
    const baseQuery = { institution: instId, isDeleted: { $ne: true } };
    
    // Only filter by academicYear if explicitly provided
    if (academicYear) {
      baseQuery.academicYear = academicYear;
    }

    const [
      totalApplications,
      statusCounts,
      classWiseApplications,
      monthlyApplications
    ] = await Promise.all([
      AdmissionApplication.countDocuments(baseQuery),
      AdmissionApplication.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      AdmissionApplication.aggregate([
        { $match: baseQuery },
        { 
          $group: { 
            _id: '$applyingForClass', 
            count: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            enrolled: { $sum: { $cond: [{ $eq: ['$status', 'enrolled'] }, 1, 0] } }
          } 
        },
        {
          $lookup: {
            from: 'classes',
            localField: '_id',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        { $unwind: '$classInfo' },
        { $project: { className: '$classInfo.name', count: 1, approved: 1, enrolled: 1 } }
      ]),
      AdmissionApplication.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    return {
      academicYear: academicYear || 'all',
      total: totalApplications,
      byStatus: {
        submitted: statusMap[APPLICATION_STATUS.SUBMITTED] || 0,
        underReview: statusMap[APPLICATION_STATUS.UNDER_REVIEW] || 0,
        documentPending: statusMap[APPLICATION_STATUS.DOCUMENT_PENDING] || 0,
        approved: statusMap[APPLICATION_STATUS.APPROVED] || 0,
        rejected: statusMap[APPLICATION_STATUS.REJECTED] || 0,
        enrolled: statusMap[APPLICATION_STATUS.ENROLLED] || 0,
        withdrawn: statusMap[APPLICATION_STATUS.WITHDRAWN] || 0
      },
      byClass: classWiseApplications,
      byMonth: monthlyApplications
    };
  }

  // Delete application (soft delete)
  async deleteApplication(applicationId, institutionId) {
    const application = await AdmissionApplication.findOneAndUpdate(
      { 
        _id: applicationId, 
        institution: institutionId,
        status: { $nin: [APPLICATION_STATUS.ENROLLED] }
      },
      { isDeleted: true },
      { new: true }
    );

    if (!application) {
      throw new ApiError(404, 'Application not found or cannot be deleted');
    }

    return application;
  }

  // Schedule entrance test
  async scheduleEntranceTest(applicationId, institutionId, testData) {
    const application = await AdmissionApplication.findOneAndUpdate(
      { 
        _id: applicationId, 
        institution: institutionId,
        isDeleted: false
      },
      { 
        $set: { 
          'entranceTest.scheduled': true,
          'entranceTest.date': testData.date,
          'entranceTest.maxScore': testData.maxScore
        }
      },
      { new: true }
    );

    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    return application;
  }

  // Update entrance test score
  async updateEntranceTestScore(applicationId, institutionId, scoreData) {
    const application = await AdmissionApplication.findOneAndUpdate(
      { 
        _id: applicationId, 
        institution: institutionId,
        'entranceTest.scheduled': true,
        isDeleted: false
      },
      { 
        $set: { 
          'entranceTest.score': scoreData.score,
          'entranceTest.remarks': scoreData.remarks
        }
      },
      { new: true }
    );

    if (!application) {
      throw new ApiError(404, 'Application not found or test not scheduled');
    }

    return application;
  }
}

module.exports = new AdmissionService();
