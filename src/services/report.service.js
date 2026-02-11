const User = require('../models/User');
const { Class, Section } = require('../models/Class');
const Attendance = require('../models/Attendance');
const { FeePayment } = require('../models/Fee');
const { Book, BookIssue } = require('../models/Library');
const { EmployeeSalary, Payslip } = require('../models/Payroll');
const mongoose = require('mongoose');

class ReportService {
  // Student Reports
  async getStudentReport(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    
    const [total, byClass, byGender, newThisMonth] = await Promise.all([
      User.countDocuments({ institution: instId, role: 'student', isActive: true }),
      User.aggregate([
        { $match: { institution: instId, role: 'student', isActive: true } },
        { $group: { _id: '$studentData.class', count: { $sum: 1 } } },
        { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
        { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
        { $project: { className: '$class.name', count: 1 } },
        { $sort: { className: 1 } }
      ]),
      User.aggregate([
        { $match: { institution: instId, role: 'student', isActive: true } },
        { $group: { _id: '$profile.gender', count: { $sum: 1 } } }
      ]),
      User.countDocuments({
        institution: instId,
        role: 'student',
        isActive: true,
        createdAt: { $gte: new Date(new Date().setDate(1)) }
      })
    ]);

    return {
      total,
      byClass: byClass.map(c => ({ class: c.className || 'Unassigned', count: c.count })),
      byGender: byGender.reduce((acc, g) => { acc[g._id || 'unknown'] = g.count; return acc; }, {}),
      newThisMonth
    };
  }

  // Staff Reports
  async getStaffReport(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    
    const [teachers, staff, coordinators, byDepartment] = await Promise.all([
      User.countDocuments({ institution: instId, role: 'teacher', isActive: true }),
      User.countDocuments({ institution: instId, role: 'staff', isActive: true }),
      User.countDocuments({ institution: instId, role: 'coordinator', isActive: true }),
      User.aggregate([
        { $match: { institution: instId, role: 'teacher', isActive: true } },
        { $group: { _id: '$teacherData.department', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total: teachers + staff + coordinators,
      teachers,
      staff,
      coordinators,
      byDepartment
    };
  }

  // Attendance Reports
  async getAttendanceReport(institutionId, query = {}) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const { startDate, endDate, classId, type = 'student' } = query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const match = { institutionId: instId };
    if (Object.keys(dateFilter).length) match.date = dateFilter;
    if (classId) match.class = new mongoose.Types.ObjectId(classId);
    if (type) match.type = type;

    const [summary, daily] = await Promise.all([
      Attendance.aggregate([
        { $match: match },
        { $unwind: '$records' },
        { $group: {
          _id: '$records.status',
          count: { $sum: 1 }
        }}
      ]),
      Attendance.aggregate([
        { $match: match },
        { $unwind: '$records' },
        { $group: {
          _id: { date: '$date', status: '$records.status' },
          count: { $sum: 1 }
        }},
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    const summaryObj = summary.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});
    const totalRecords = Object.values(summaryObj).reduce((a, b) => a + b, 0);

    return {
      summary: summaryObj,
      total: totalRecords,
      presentPercentage: totalRecords ? ((summaryObj.present || 0) / totalRecords * 100).toFixed(1) : 0,
      daily
    };
  }

  // Fee Reports
  async getFeeReport(institutionId, query = {}) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const { startDate, endDate, academicYear } = query;

    const match = { institutionId: instId };
    if (academicYear) match.academicYear = academicYear;
    if (startDate || endDate) {
      match.paidAt = {};
      if (startDate) match.paidAt.$gte = new Date(startDate);
      if (endDate) match.paidAt.$lte = new Date(endDate);
    }

    const [totalCollected, byMonth, byPaymentMode, pending] = await Promise.all([
      FeePayment.aggregate([
        { $match: { ...match, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: { ...match, status: 'completed' } },
        { $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      FeePayment.aggregate([
        { $match: { ...match, status: 'completed' } },
        { $group: { _id: '$paymentMode', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      FeePayment.aggregate([
        { $match: { institutionId: instId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalCollected: totalCollected[0]?.total || 0,
      totalTransactions: totalCollected[0]?.count || 0,
      pendingAmount: pending[0]?.total || 0,
      pendingCount: pending[0]?.count || 0,
      byMonth: byMonth.map(m => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        total: m.total,
        count: m.count
      })),
      byPaymentMode: byPaymentMode.reduce((acc, p) => {
        acc[p._id || 'unknown'] = { total: p.total, count: p.count };
        return acc;
      }, {})
    };
  }

  // Library Reports
  async getLibraryReport(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);

    const [totalBooks, totalCopies, issued, overdue, popular] = await Promise.all([
      Book.countDocuments({ institutionId: instId }),
      Book.aggregate([
        { $match: { institutionId: instId } },
        { $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } }
      ]),
      BookIssue.countDocuments({ institutionId: instId, status: 'issued' }),
      BookIssue.countDocuments({ institutionId: instId, status: 'issued', dueDate: { $lt: new Date() } }),
      BookIssue.aggregate([
        { $match: { institutionId: instId } },
        { $group: { _id: '$book', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
        { $unwind: '$book' },
        { $project: { title: '$book.title', author: '$book.author', count: 1 } }
      ])
    ]);

    return {
      totalBooks,
      totalCopies: totalCopies[0]?.total || 0,
      availableCopies: totalCopies[0]?.available || 0,
      issued,
      overdue,
      popularBooks: popular
    };
  }

  // Payroll Reports
  async getPayrollReport(institutionId, query = {}) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const { year = new Date().getFullYear() } = query;

    const [employeeCount, totalSalary, monthlyPayroll, byStatus] = await Promise.all([
      EmployeeSalary.countDocuments({ institutionId: instId, status: 'active' }),
      EmployeeSalary.aggregate([
        { $match: { institutionId: instId, status: 'active' } },
        { $group: { _id: null, gross: { $sum: '$grossSalary' }, net: { $sum: '$netSalary' } } }
      ]),
      Payslip.aggregate([
        { $match: { institutionId: instId, year: parseInt(year), status: 'paid' } },
        { $group: {
          _id: '$month',
          total: { $sum: '$netSalary' },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      Payslip.aggregate([
        { $match: { institutionId: instId, year: parseInt(year) } },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$netSalary' } } }
      ])
    ]);

    return {
      employeeCount,
      monthlyGross: totalSalary[0]?.gross || 0,
      monthlyNet: totalSalary[0]?.net || 0,
      yearlyPaid: monthlyPayroll.reduce((sum, m) => sum + m.total, 0),
      monthlyPayroll: monthlyPayroll.map(m => ({ month: m._id, total: m.total, count: m.count })),
      byStatus: byStatus.reduce((acc, s) => { acc[s._id] = { count: s.count, total: s.total }; return acc; }, {})
    };
  }

  // Dashboard Summary
  async getDashboardSummary(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [students, teachers, staff, parents, feeThisMonth, pendingFees, attendanceToday, recentUsers, todayBirthdays] = await Promise.all([
      User.countDocuments({ institution: instId, role: 'student', isActive: true }),
      User.countDocuments({ institution: instId, role: 'teacher', isActive: true }),
      User.countDocuments({ institution: instId, role: 'staff', isActive: true }),
      User.countDocuments({ institution: instId, role: 'parent', isActive: true }),
      FeePayment.aggregate([
        { $match: { institution: instId, status: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      FeePayment.aggregate([
        { $match: { institution: instId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Attendance.aggregate([
        { $match: { institution: instId, date: { $gte: today } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      User.find({ institution: instId, isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('profile.firstName profile.lastName role createdAt')
        .lean(),
      User.aggregate([
        { $match: { institution: instId, isActive: true, 'profile.dateOfBirth': { $exists: true } } },
        { $addFields: { 
          birthMonth: { $month: '$profile.dateOfBirth' }, 
          birthDay: { $dayOfMonth: '$profile.dateOfBirth' } 
        }},
        { $match: { birthMonth: now.getMonth() + 1, birthDay: now.getDate() } },
        { $project: { name: { $concat: ['$profile.firstName', ' ', '$profile.lastName'] }, role: 1 } },
        { $limit: 10 }
      ])
    ]);

    const attendanceSummary = attendanceToday.reduce((acc, a) => { acc[a._id] = a.count; return acc; }, {});
    const totalAttendance = Object.values(attendanceSummary).reduce((a, b) => a + b, 0);

    const recentActivity = recentUsers.map(u => ({
      message: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''} joined as ${u.role}`,
      time: new Date(u.createdAt).toLocaleDateString()
    }));

    return {
      totalStudents: students,
      totalTeachers: teachers,
      totalStaff: staff,
      totalParents: parents,
      feeCollectedThisMonth: feeThisMonth[0]?.total || 0,
      pendingFees: pendingFees[0]?.total || 0,
      todayAttendance: {
        present: attendanceSummary.present || 0,
        absent: attendanceSummary.absent || 0,
        total: totalAttendance,
        percentage: totalAttendance ? Math.round((attendanceSummary.present || 0) / totalAttendance * 100) : 0
      },
      recentActivity: { activities: recentActivity },
      todayBirthdays: todayBirthdays,
      announcements: []
    };
  }
}

module.exports = new ReportService();
