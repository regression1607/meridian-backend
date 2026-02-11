const mongoose = require('mongoose');
const { FeeStructure, FeePayment } = require('../models/Fee');
const User = require('../models/User');
const { TransportAllocation } = require('../models/Transport');
const { BookIssue } = require('../models/Library');
const { RoomAllocation } = require('../models/Hostel');
const ApiError = require('../utils/apiError');
const { FEE_STATUS } = require('../config/constants');

class FeeService {
  // Fee Structure Methods
  async createFeeStructure(data, institutionId) {
    const feeStructure = await FeeStructure.create({
      ...data,
      institution: institutionId
    });
    return feeStructure;
  }

  async getFeeStructures(institutionId, filters = {}) {
    const query = { institution: institutionId, isActive: true };
    if (filters.type) query.type = filters.type;
    if (filters.academicYear) query.academicYear = filters.academicYear;

    const structures = await FeeStructure.find(query)
      .populate('classes', 'name')
      .sort({ type: 1, name: 1 })
      .lean();

    return structures;
  }

  async updateFeeStructure(id, data, institutionId) {
    const structure = await FeeStructure.findOneAndUpdate(
      { _id: id, institution: institutionId },
      data,
      { new: true }
    );
    if (!structure) throw ApiError.notFound('Fee structure not found');
    return structure;
  }

  // Fee Payment Methods
  async recordPayment(data, institutionId, collectedBy) {
    const { studentId, amount, paymentMethod, transactionId, remarks, feeStructureId, discount, discountReason, duesBreakdown } = data;

    const student = await User.findOne({ _id: studentId, institution: institutionId, role: 'student' });
    if (!student) throw ApiError.notFound('Student not found');

    // Generate receipt number
    const count = await FeePayment.countDocuments({ institution: institutionId });
    const receiptNumber = `RCP${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;

    const payment = await FeePayment.create({
      institution: institutionId,
      student: studentId,
      feeStructure: feeStructureId,
      amount,
      paidAmount: amount - (discount || 0),
      dueDate: new Date(),
      paidDate: new Date(),
      status: FEE_STATUS.PAID,
      paymentMethod,
      transactionId,
      receiptNumber,
      discount: discount || 0,
      discountReason,
      remarks,
      collectedBy,
      duesBreakdown: duesBreakdown || null,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });

    // Mark library fines as paid if included
    if (duesBreakdown?.libraryFines?.length > 0) {
      const fineIds = duesBreakdown.libraryFines.map(f => f.fineId);
      await BookIssue.updateMany(
        { _id: { $in: fineIds } },
        { $set: { finePaid: true } }
      );
    }

    return payment;
  }

  async getStudentFees(studentId, institutionId) {
    const payments = await FeePayment.find({
      student: studentId,
      institution: institutionId
    })
      .populate('feeStructure', 'name type')
      .populate('collectedBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary
    const summary = {
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0
    };

    payments.forEach(p => {
      if (p.status === 'paid') summary.totalPaid += p.paidAmount;
      else if (p.status === 'pending') summary.totalPending += p.amount;
      else if (p.status === 'overdue') summary.totalOverdue += p.amount;
    });

    return { payments, summary };
  }

  async getFeePayments(institutionId, filters = {}) {
    const { status, studentId, startDate, endDate, month, year, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query = { institution: institutionId };
    if (status) query.status = status;
    if (studentId) query.student = studentId;
    
    // Handle month/year filtering with fallback for legacy records
    if (month && year) {
      const filterMonth = parseInt(month);
      const filterYear = parseInt(year);
      const monthStart = new Date(filterYear, filterMonth - 1, 1);
      const monthEnd = new Date(filterYear, filterMonth, 0, 23, 59, 59);
      
      query.$or = [
        { month: filterMonth, year: filterYear },
        { 
          month: { $exists: false },
          $or: [
            { paidDate: { $gte: monthStart, $lte: monthEnd } },
            { dueDate: { $gte: monthStart, $lte: monthEnd } },
            { createdAt: { $gte: monthStart, $lte: monthEnd } }
          ]
        }
      ];
    }
    
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const [payments, total] = await Promise.all([
      FeePayment.find(query)
        .populate('student', 'profile.firstName profile.lastName email studentData.admissionNumber studentData.class studentData.parent')
        .populate('feeStructure', 'name type amount')
        .populate('collectedBy', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FeePayment.countDocuments(query)
    ]);

    return {
      data: payments,
      meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    };
  }

  async updatePaymentStatus(paymentId, status, institutionId) {
    const validStatuses = ['pending', 'paid', 'overdue', 'partial', 'waived'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest('Invalid status');
    }

    const payment = await FeePayment.findOneAndUpdate(
      { _id: paymentId, institution: institutionId },
      { status },
      { new: true }
    ).populate('student', 'profile.firstName profile.lastName');

    if (!payment) throw ApiError.notFound('Payment not found');
    return payment;
  }

  async generateMonthlyFees(institutionId, month, year) {
    // Get all active fee structures
    const structures = await FeeStructure.find({ 
      institution: institutionId, 
      isActive: true,
      frequency: { $in: ['monthly', 'quarterly', 'half_yearly', 'yearly'] }
    }).lean();

    if (structures.length === 0) {
      return { created: 0, message: 'No active fee structures found' };
    }

    // Get all students in the institution
    const students = await User.find({ 
      institution: institutionId, 
      role: 'student',
      isActive: { $ne: false }
    }).select('_id studentData.class').lean();

    if (students.length === 0) {
      return { created: 0, message: 'No students found' };
    }

    // Calculate due date (10th of the month by default)
    const dueDate = new Date(year, month - 1, 10);

    let created = 0;
    const bulkOps = [];

    for (const student of students) {
      for (const structure of structures) {
        // Check if structure applies to this student
        let applicable = false;
        if (structure.applicableTo === 'all') {
          applicable = true;
        } else if (structure.applicableTo === 'class' && structure.classes?.length > 0) {
          applicable = structure.classes.some(c => 
            c.toString() === student.studentData?.class?.toString()
          );
        }

        if (!applicable) continue;

        // Check frequency - only generate if applicable for this month
        if (structure.frequency === 'quarterly' && ![1, 4, 7, 10].includes(month)) continue;
        if (structure.frequency === 'half_yearly' && ![1, 7].includes(month)) continue;
        if (structure.frequency === 'yearly' && month !== 4) continue; // April for yearly

        // Check if payment record already exists for this student, structure, month, year
        const existing = await FeePayment.findOne({
          institution: institutionId,
          student: student._id,
          feeStructure: structure._id,
          month: month,
          year: year
        });

        if (!existing) {
          bulkOps.push({
            insertOne: {
              document: {
                institution: institutionId,
                student: student._id,
                feeStructure: structure._id,
                amount: structure.amount,
                paidAmount: 0,
                dueDate: new Date(year, month - 1, structure.dueDay || 10),
                status: FEE_STATUS.PENDING,
                month: month,
                year: year,
                lateFee: 0,
                discount: 0,
                alertCount: 0
              }
            }
          });
          created++;
        }
      }
    }

    if (bulkOps.length > 0) {
      await FeePayment.bulkWrite(bulkOps);
    }

    return { 
      created, 
      totalStudents: students.length,
      totalStructures: structures.length,
      message: `Generated ${created} pending fee records for ${month}/${year}` 
    };
  }

  async getFeeStats(institutionId, filters = {}) {
    const { month, year } = filters;
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    // Create date range for the selected month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const matchQuery = { 
      institution: new mongoose.Types.ObjectId(institutionId),
      $or: [
        { month: currentMonth, year: currentYear },
        { 
          month: { $exists: false },
          $or: [
            { paidDate: { $gte: startDate, $lte: endDate } },
            { dueDate: { $gte: startDate, $lte: endDate } },
            { createdAt: { $gte: startDate, $lte: endDate } }
          ]
        }
      ]
    };

    const stats = await FeePayment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
          collected: { $sum: { $ifNull: ['$paidAmount', '$amount'] } }
        }
      }
    ]);

    const result = {
      totalCollected: 0,
      totalPending: 0,
      totalOverdue: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0
    };

    stats.forEach(s => {
      if (s._id === 'paid') {
        result.totalCollected = s.collected;
        result.paidCount = s.count;
      } else if (s._id === 'pending') {
        result.totalPending = s.total;
        result.pendingCount = s.count;
      } else if (s._id === 'overdue') {
        result.totalOverdue = s.total;
        result.overdueCount = s.count;
      }
    });

    return result;
  }

  async getDefaulters(institutionId, filters = {}) {
    const { classId, minAmount = 0 } = filters;

    const pipeline = [
      {
        $match: {
          institution: new mongoose.Types.ObjectId(institutionId),
          status: { $in: ['pending', 'overdue'] }
        }
      },
      {
        $group: {
          _id: '$student',
          totalDue: { $sum: '$amount' },
          payments: { $push: '$$ROOT' }
        }
      },
      { $match: { totalDue: { $gte: minAmount } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          _id: 1,
          totalDue: 1,
          student: {
            name: { $concat: ['$studentInfo.profile.firstName', ' ', '$studentInfo.profile.lastName'] },
            email: '$studentInfo.email',
            admissionNumber: '$studentInfo.studentData.admissionNumber',
            class: '$studentInfo.studentData.class'
          }
        }
      },
      { $sort: { totalDue: -1 } },
      { $limit: 50 }
    ];

    const defaulters = await FeePayment.aggregate(pipeline);
    return defaulters;
  }

  async sendFeeReminder(paymentId, institutionId, sentBy) {
    const payment = await FeePayment.findOne({ _id: paymentId, institution: institutionId })
      .populate('student', 'profile.firstName profile.lastName email studentData.parent')
      .populate('feeStructure', 'name');

    if (!payment) throw ApiError.notFound('Payment not found');

    const student = payment.student;
    const studentName = student?.profile ? `${student.profile.firstName} ${student.profile.lastName}` : 'Student';
    const feeType = payment.feeStructure?.name || 'Fee';
    const amount = payment.amount;
    const dueDate = payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('en-IN') : 'N/A';

    // Get parent email if available
    let parentEmail = null;
    if (student?.studentData?.parent) {
      const parent = await User.findById(student.studentData.parent).select('email profile.firstName profile.lastName');
      if (parent) {
        parentEmail = parent.email;
      }
    }

    const recipientEmail = parentEmail || student?.email;
    if (!recipientEmail) throw ApiError.badRequest('No email address found for student or parent');

    // Update payment with alert info
    payment.alertCount = (payment.alertCount || 0) + 1;
    payment.lastAlertSentAt = new Date();
    payment.alertHistory.push({
      sentAt: new Date(),
      sentTo: recipientEmail,
      sentBy: sentBy
    });
    await payment.save();

    // In production, you would send actual email here using nodemailer or similar
    // For now, we'll just log and return success
    console.log(`Fee reminder sent to ${recipientEmail} for ${studentName}`);
    console.log(`Amount: ₹${amount}, Due Date: ${dueDate}, Fee Type: ${feeType}`);

    return {
      success: true,
      sentTo: recipientEmail,
      studentName,
      alertCount: payment.alertCount,
      lastAlertSentAt: payment.lastAlertSentAt
    };
  }

  async sendBulkFeeReminders(paymentIds, institutionId, sentBy) {
    const results = [];
    for (const paymentId of paymentIds) {
      try {
        const result = await this.sendFeeReminder(paymentId, institutionId, sentBy);
        results.push({ paymentId, ...result });
      } catch (error) {
        results.push({ paymentId, success: false, error: error.message });
      }
    }
    return results;
  }

  // Get all pending dues for a student (transport, library fines, hostel)
  async getStudentDues(studentId, institutionId) {
    const dues = {
      transport: null,
      libraryFines: [],
      hostel: null,
      totalDue: 0
    };

    // 1. Get active transport allocation with monthly fee
    const transportAllocation = await TransportAllocation.findOne({
      student: studentId,
      institution: institutionId,
      status: 'active',
      isDeleted: { $ne: true }
    }).populate('route', 'routeName routeCode').lean();

    if (transportAllocation && transportAllocation.monthlyFee > 0) {
      dues.transport = {
        _id: transportAllocation._id,
        type: 'transport',
        description: `Transport Fee - ${transportAllocation.route?.routeName || 'Route'} (${transportAllocation.stop})`,
        amount: transportAllocation.monthlyFee,
        route: transportAllocation.route?.routeName,
        stop: transportAllocation.stop
      };
      dues.totalDue += transportAllocation.monthlyFee;
    }

    // 2. Get unpaid library fines
    const libraryFines = await BookIssue.find({
      issuedTo: studentId,
      institution: institutionId,
      fineAmount: { $gt: 0 },
      finePaid: { $ne: true },
      isDeleted: { $ne: true }
    }).populate('book', 'title bookCode').lean();

    if (libraryFines.length > 0) {
      dues.libraryFines = libraryFines.map(fine => ({
        _id: fine._id,
        type: 'library',
        description: `Library Fine - ${fine.book?.title || 'Book'}`,
        bookTitle: fine.book?.title,
        bookCode: fine.book?.bookCode,
        amount: fine.fineAmount,
        status: fine.status,
        dueDate: fine.dueDate
      }));
      dues.totalDue += libraryFines.reduce((sum, f) => sum + f.fineAmount, 0);
    }

    // 3. Get active hostel allocation with monthly rent
    const hostelAllocation = await RoomAllocation.findOne({
      student: studentId,
      institution: institutionId,
      status: 'active',
      isDeleted: { $ne: true }
    }).populate({
      path: 'room',
      select: 'roomNumber floor',
      populate: { path: 'block', select: 'name code' }
    }).lean();

    if (hostelAllocation && hostelAllocation.monthlyRent > 0) {
      const roomInfo = hostelAllocation.room;
      dues.hostel = {
        _id: hostelAllocation._id,
        type: 'hostel',
        description: `Hostel Rent - ${roomInfo?.block?.name || 'Block'} Room ${roomInfo?.roomNumber || ''}`,
        amount: hostelAllocation.monthlyRent,
        block: roomInfo?.block?.name,
        roomNumber: roomInfo?.roomNumber,
        securityDeposit: hostelAllocation.securityDeposit
      };
      dues.totalDue += hostelAllocation.monthlyRent;
    }

    return dues;
  }
}

module.exports = new FeeService();
