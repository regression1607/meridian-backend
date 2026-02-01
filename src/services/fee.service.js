const mongoose = require('mongoose');
const { FeeStructure, FeePayment } = require('../models/Fee');
const User = require('../models/User');
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
    const { studentId, amount, paymentMethod, transactionId, remarks, feeStructureId, discount, discountReason } = data;

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
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });

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
    const { status, studentId, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query = { institution: institutionId };
    if (status) query.status = status;
    if (studentId) query.student = studentId;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const [payments, total] = await Promise.all([
      FeePayment.find(query)
        .populate('student', 'profile.firstName profile.lastName studentData.admissionNumber')
        .populate('feeStructure', 'name type')
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

  async getFeeStats(institutionId, filters = {}) {
    const { month, year } = filters;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const matchQuery = { 
      institution: new mongoose.Types.ObjectId(institutionId),
      year: currentYear,
      month: currentMonth
    };

    const stats = await FeePayment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
          collected: { $sum: '$paidAmount' }
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
}

module.exports = new FeeService();
