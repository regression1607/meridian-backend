const mongoose = require('mongoose');
const Homework = require('../models/Homework');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

class HomeworkService {
  async createHomework(data, institutionId, assignedBy) {
    const homework = await Homework.create({
      ...data,
      institution: institutionId,
      assignedBy
    });

    return homework.populate([
      { path: 'subject', select: 'name code' },
      { path: 'class', select: 'name' },
      { path: 'section', select: 'name' },
      { path: 'assignedBy', select: 'profile.firstName profile.lastName' }
    ]);
  }

  async getHomework(filters, institutionId) {
    const { classId, sectionId, subjectId, status, assignedBy, page = 1, limit = 20 } = filters;

    const query = { institution: institutionId };

    if (classId) query.class = classId;
    if (sectionId) query.section = sectionId;
    if (subjectId) query.subject = subjectId;
    if (status) query.status = status;
    if (assignedBy) query.assignedBy = assignedBy;

    const skip = (page - 1) * limit;

    const [homework, total] = await Promise.all([
      Homework.find(query)
        .populate('subject', 'name code')
        .populate('class', 'name')
        .populate('section', 'name')
        .populate('assignedBy', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Homework.countDocuments(query)
    ]);

    return {
      data: homework,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getHomeworkById(homeworkId, institutionId) {
    const homework = await Homework.findOne({
      _id: homeworkId,
      institution: institutionId
    })
      .populate('subject', 'name code')
      .populate('class', 'name')
      .populate('section', 'name')
      .populate('assignedBy', 'profile.firstName profile.lastName email')
      .populate('submissions.student', 'profile.firstName profile.lastName studentData.rollNumber')
      .populate('submissions.gradedBy', 'profile.firstName profile.lastName');

    if (!homework) {
      throw ApiError.notFound('Homework not found');
    }

    return homework;
  }

  async updateHomework(homeworkId, updateData, institutionId) {
    const homework = await Homework.findOneAndUpdate(
      { _id: homeworkId, institution: institutionId },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('subject', 'name code')
      .populate('class', 'name')
      .populate('section', 'name')
      .populate('assignedBy', 'profile.firstName profile.lastName');

    if (!homework) {
      throw ApiError.notFound('Homework not found');
    }

    return homework;
  }

  async deleteHomework(homeworkId, institutionId) {
    const homework = await Homework.findOneAndDelete({
      _id: homeworkId,
      institution: institutionId
    });

    if (!homework) {
      throw ApiError.notFound('Homework not found');
    }

    return { message: 'Homework deleted successfully' };
  }

  async submitHomework(homeworkId, studentId, submissionData, institutionId) {
    const homework = await Homework.findOne({
      _id: homeworkId,
      institution: institutionId
    });

    if (!homework) {
      throw ApiError.notFound('Homework not found');
    }

    if (homework.status === 'closed') {
      throw ApiError.badRequest('This homework is closed for submissions');
    }

    // Check if student already submitted
    const existingSubmission = homework.submissions.find(
      s => s.student.toString() === studentId.toString()
    );

    if (existingSubmission) {
      throw ApiError.badRequest('You have already submitted this homework');
    }

    const isLate = new Date() > homework.dueDate;
    if (isLate && !homework.allowLateSubmission) {
      throw ApiError.badRequest('Late submissions are not allowed for this homework');
    }

    const submission = {
      student: studentId,
      content: submissionData.content,
      attachments: submissionData.attachments || [],
      status: isLate ? 'late' : 'submitted',
      submittedAt: new Date()
    };

    homework.submissions.push(submission);
    await homework.save();

    return homework.populate('submissions.student', 'profile.firstName profile.lastName');
  }

  async gradeSubmission(homeworkId, studentId, gradeData, gradedBy, institutionId) {
    const homework = await Homework.findOne({
      _id: homeworkId,
      institution: institutionId
    });

    if (!homework) {
      throw ApiError.notFound('Homework not found');
    }

    const submission = homework.submissions.find(
      s => s.student.toString() === studentId.toString()
    );

    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    submission.grade = {
      score: gradeData.score,
      maxScore: homework.maxScore,
      percentage: (gradeData.score / homework.maxScore) * 100
    };
    submission.feedback = gradeData.feedback;
    submission.gradedBy = gradedBy;
    submission.gradedAt = new Date();
    submission.status = 'graded';

    await homework.save();

    return homework.populate([
      { path: 'submissions.student', select: 'profile.firstName profile.lastName' },
      { path: 'submissions.gradedBy', select: 'profile.firstName profile.lastName' }
    ]);
  }

  async getStudentHomework(studentId, institutionId, filters = {}) {
    const student = await User.findById(studentId).select('studentData');
    if (!student || !student.studentData) {
      throw ApiError.notFound('Student not found');
    }

    const query = {
      institution: institutionId,
      class: student.studentData.class,
      status: 'published'
    };

    if (student.studentData.section) {
      query.$or = [
        { section: student.studentData.section },
        { section: null }
      ];
    }

    if (filters.subjectId) query.subject = filters.subjectId;

    const homework = await Homework.find(query)
      .populate('subject', 'name code')
      .populate('class', 'name')
      .populate('section', 'name')
      .populate('assignedBy', 'profile.firstName profile.lastName')
      .sort({ dueDate: 1 })
      .lean();

    // Add submission status for each homework
    const result = homework.map(hw => {
      const submission = hw.submissions?.find(
        s => s.student.toString() === studentId.toString()
      );
      return {
        ...hw,
        mySubmission: submission || null,
        hasSubmitted: !!submission
      };
    });

    return result;
  }

  async getHomeworkStats(institutionId, filters = {}) {
    const { classId, sectionId, teacherId } = filters;

    const matchQuery = { institution: new mongoose.Types.ObjectId(institutionId) };
    if (classId) matchQuery.class = new mongoose.Types.ObjectId(classId);
    if (sectionId) matchQuery.section = new mongoose.Types.ObjectId(sectionId);
    if (teacherId) matchQuery.assignedBy = new mongoose.Types.ObjectId(teacherId);

    const stats = await Homework.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalHomework: { $sum: 1 },
          totalSubmissions: { $sum: { $size: '$submissions' } },
          avgSubmissions: { $avg: { $size: '$submissions' } }
        }
      }
    ]);

    const statusCounts = await Homework.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      totalHomework: stats[0]?.totalHomework || 0,
      totalSubmissions: stats[0]?.totalSubmissions || 0,
      avgSubmissionsPerHomework: Math.round(stats[0]?.avgSubmissions || 0),
      byStatus: statusCounts.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {})
    };
  }
}

module.exports = new HomeworkService();
