const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { ATTENDANCE_STATUS } = require('../config/constants');

class AttendanceService {
  async markAttendance(data, institutionId, markedBy) {
    const { userId, date, status, remarks, checkInTime, checkOutTime, classId, sectionId } = data;

    // Get user to determine userType
    const user = await User.findOne({ _id: userId, institution: institutionId });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const userType = ['student', 'teacher', 'staff'].includes(user.role) ? user.role : 'staff';
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Use passed classId/sectionId or fall back to user's studentData
    const attendanceClass = classId || user.studentData?.class;
    const attendanceSection = sectionId || user.studentData?.section;

    // Check if attendance already exists
    const existing = await Attendance.findOne({
      user: userId,
      date: attendanceDate
    });

    if (existing) {
      // Update existing attendance
      existing.status = status;
      existing.remarks = remarks;
      existing.checkInTime = checkInTime;
      existing.checkOutTime = checkOutTime;
      existing.markedBy = markedBy;
      // Update class/section if provided
      if (attendanceClass) existing.class = attendanceClass;
      if (attendanceSection) existing.section = attendanceSection;
      await existing.save();
      return existing;
    }

    // Create new attendance
    const attendance = await Attendance.create({
      institution: institutionId,
      user: userId,
      userType,
      date: attendanceDate,
      status,
      remarks,
      checkInTime,
      checkOutTime,
      class: attendanceClass,
      section: attendanceSection,
      markedBy
    });

    return attendance;
  }

  async markBulkAttendance(data, institutionId, markedBy) {
    const { date, attendanceData, classId, sectionId } = data;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];
    for (const record of attendanceData) {
      try {
        const result = await this.markAttendance(
          { ...record, date: attendanceDate, classId, sectionId },
          institutionId,
          markedBy
        );
        results.push({ userId: record.userId, success: true, data: result });
      } catch (error) {
        results.push({ userId: record.userId, success: false, error: error.message });
      }
    }

    return results;
  }

  async getAttendance(filters, institutionId) {
    const { date, userId, classId, sectionId, userType, status, startDate, endDate } = filters;

    const query = { institution: institutionId };

    if (date) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      query.date = attendanceDate;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (userId) query.user = userId;
    if (classId) query.class = classId;
    if (sectionId) query.section = sectionId;
    if (userType) query.userType = userType;
    if (status) query.status = status;

    const attendance = await Attendance.find(query)
      .populate('user', 'profile.firstName profile.lastName email studentData.rollNumber')
      .populate('class', 'name')
      .populate('section', 'name')
      .populate('markedBy', 'profile.firstName profile.lastName')
      .sort({ date: -1, 'user.profile.firstName': 1 })
      .lean();

    return attendance;
  }

  async getAttendanceStats(institutionId, filters = {}) {
    const { date, classId, sectionId, userType = 'student' } = filters;

    const matchQuery = { 
      institution: new mongoose.Types.ObjectId(institutionId),
      userType 
    };

    if (date) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      matchQuery.date = attendanceDate;
    }

    if (classId) matchQuery.class = new mongoose.Types.ObjectId(classId);
    if (sectionId) matchQuery.section = new mongoose.Types.ObjectId(sectionId);

    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      present: 0,
      absent: 0,
      late: 0,
      half_day: 0,
      leave: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    result.presentPercentage = result.total > 0 
      ? ((result.present + result.late) / result.total * 100).toFixed(1) 
      : 0;

    return result;
  }

  async getUserAttendanceReport(userId, institutionId, startDate, endDate) {
    const query = {
      user: userId,
      institution: institutionId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const records = await Attendance.find(query).sort({ date: 1 }).lean();

    const stats = {
      totalDays: records.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      leave: 0
    };

    records.forEach(record => {
      switch (record.status) {
        case 'present': stats.present++; break;
        case 'absent': stats.absent++; break;
        case 'late': stats.late++; break;
        case 'half_day': stats.halfDay++; break;
        case 'leave': stats.leave++; break;
      }
    });

    stats.attendancePercentage = stats.totalDays > 0
      ? ((stats.present + stats.late + stats.halfDay * 0.5) / stats.totalDays * 100).toFixed(1)
      : 0;

    return { records, stats };
  }

  async getClassAttendance(classId, sectionId, date, institutionId) {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Get all students in the class/section
    const studentQuery = {
      institution: institutionId,
      role: 'student',
      'studentData.class': classId,
      isActive: true
    };
    if (sectionId) studentQuery['studentData.section'] = sectionId;

    const students = await User.find(studentQuery)
      .select('profile.firstName profile.lastName studentData.rollNumber')
      .sort({ 'studentData.rollNumber': 1 })
      .lean();

    // Get existing attendance records
    const attendanceRecords = await Attendance.find({
      institution: institutionId,
      class: classId,
      ...(sectionId && { section: sectionId }),
      date: attendanceDate
    }).lean();

    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.user.toString()] = record;
    });

    // Merge students with attendance
    const result = students.map(student => ({
      _id: student._id,
      name: `${student.profile.firstName} ${student.profile.lastName}`,
      rollNumber: student.studentData?.rollNumber || '-',
      attendance: attendanceMap[student._id.toString()] || null,
      status: attendanceMap[student._id.toString()]?.status || 'unmarked'
    }));

    return result;
  }
}

module.exports = new AttendanceService();
