const { SalaryStructure, EmployeeSalary, Payslip, Bonus, Advance, PayrollAttendance } = require('../models/Payroll');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

class PayrollService {
  // ============ SALARY STRUCTURE METHODS ============
  
  async createSalaryStructure(institutionId, data, userId) {
    const existing = await SalaryStructure.findOne({ institutionId, code: data.code });
    if (existing) {
      throw new ApiError(400, 'Salary structure with this code already exists');
    }
    
    const structure = new SalaryStructure({
      ...data,
      institutionId,
      createdBy: userId
    });
    await structure.save();
    return structure;
  }

  async getSalaryStructures(institutionId, query = {}) {
    const { page = 1, limit = 10, status, search } = query;
    const filter = { institutionId };
    
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [structures, total] = await Promise.all([
      SalaryStructure.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SalaryStructure.countDocuments(filter)
    ]);

    return {
      structures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getSalaryStructureById(id, institutionId) {
    const structure = await SalaryStructure.findOne({ _id: id, institutionId });
    if (!structure) throw new ApiError(404, 'Salary structure not found');
    return structure;
  }

  async updateSalaryStructure(id, institutionId, data) {
    const structure = await SalaryStructure.findOne({ _id: id, institutionId });
    if (!structure) throw new ApiError(404, 'Salary structure not found');
    
    // Update fields
    Object.assign(structure, data);
    
    // Save to trigger pre-save hook that calculates grossSalary and netSalary
    await structure.save();
    return structure;
  }

  async deleteSalaryStructure(id, institutionId) {
    const inUse = await EmployeeSalary.findOne({ salaryStructure: id });
    if (inUse) throw new ApiError(400, 'Cannot delete - structure is assigned to employees');
    
    const result = await SalaryStructure.findOneAndDelete({ _id: id, institutionId });
    if (!result) throw new ApiError(404, 'Salary structure not found');
    return result;
  }

  // ============ EMPLOYEE SALARY METHODS ============

  async assignEmployeeSalary(institutionId, data, userId) {
    const { employeeId, salaryStructureId, ...rest } = data;
    
    const employee = await User.findOne({ 
      _id: employeeId, 
      institution: institutionId,
      role: { $in: ['teacher', 'staff', 'coordinator', 'institution_admin'] }
    });
    if (!employee) throw new ApiError(404, 'Employee not found');

    let salaryData = { ...rest };
    
    if (salaryStructureId) {
      const structure = await SalaryStructure.findById(salaryStructureId);
      if (!structure) throw new ApiError(404, 'Salary structure not found');
      
      // Use structure values as defaults
      salaryData.components = { ...structure.components, ...rest.components };
      salaryData.deductions = { ...structure.deductions, ...rest.deductions };
      salaryData.salaryStructure = salaryStructureId;
    }

    // Calculate totals
    const comp = salaryData.components || {};
    const ded = salaryData.deductions || {};
    salaryData.grossSalary = Object.values(comp).reduce((a, b) => a + (b || 0), 0);
    salaryData.netSalary = salaryData.grossSalary - Object.values(ded).reduce((a, b) => a + (b || 0), 0);

    const employeeSalary = await EmployeeSalary.findOneAndUpdate(
      { institutionId, employee: employeeId },
      { 
        $set: { 
          ...salaryData, 
          institutionId, 
          employee: employeeId,
          createdBy: userId 
        } 
      },
      { upsert: true, new: true, runValidators: true }
    );

    return employeeSalary;
  }

  async getEmployeeSalaries(institutionId, query = {}) {
    const { page = 1, limit = 10, search, status } = query;
    const instId = new mongoose.Types.ObjectId(institutionId);
    const filter = { institutionId: instId };
    
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    
    let pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $lookup: {
          from: 'salarystructures',
          localField: 'salaryStructure',
          foreignField: '_id',
          as: 'salaryStructure'
        }
      },
      { $unwind: { path: '$salaryStructure', preserveNullAndEmptyArrays: true } }
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'employee.profile.firstName': { $regex: search, $options: 'i' } },
            { 'employee.profile.lastName': { $regex: search, $options: 'i' } },
            { 'employee.email': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const [salaries, countResult] = await Promise.all([
      EmployeeSalary.aggregate(pipeline),
      EmployeeSalary.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;

    return {
      salaries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getEmployeeSalaryById(id, institutionId) {
    const salary = await EmployeeSalary.findOne({ _id: id, institutionId })
      .populate('employee', 'email profile role')
      .populate('salaryStructure');
    if (!salary) throw new ApiError(404, 'Employee salary not found');
    return salary;
  }

  async getEmployeeSalaryByEmployee(employeeId, institutionId) {
    const salary = await EmployeeSalary.findOne({ employee: employeeId, institutionId })
      .populate('salaryStructure');
    return salary;
  }

  async updateEmployeeSalary(id, institutionId, data) {
    const salary = await EmployeeSalary.findOne({ _id: id, institutionId });
    if (!salary) throw new ApiError(404, 'Employee salary not found');

    const { salaryStructureId, ...rest } = data;
    let updateData = { ...rest };

    if (salaryStructureId) {
      const structure = await SalaryStructure.findById(salaryStructureId);
      if (!structure) throw new ApiError(404, 'Salary structure not found');
      updateData.components = { ...structure.components, ...rest.components };
      updateData.deductions = { ...structure.deductions, ...rest.deductions };
      updateData.salaryStructure = salaryStructureId;
    }

    // Calculate totals
    const comp = updateData.components || salary.components || {};
    const ded = updateData.deductions || salary.deductions || {};
    updateData.grossSalary = Object.values(comp).reduce((a, b) => a + (b || 0), 0);
    updateData.netSalary = updateData.grossSalary - Object.values(ded).reduce((a, b) => a + (b || 0), 0);

    Object.assign(salary, updateData);
    await salary.save();
    return salary;
  }

  async deleteEmployeeSalary(id, institutionId) {
    // Check if there are payslips for this salary
    const hasPayslips = await Payslip.findOne({ employeeSalary: id });
    if (hasPayslips) {
      throw new ApiError(400, 'Cannot delete - employee has payslips generated');
    }

    const result = await EmployeeSalary.findOneAndDelete({ _id: id, institutionId });
    if (!result) throw new ApiError(404, 'Employee salary not found');
    return result;
  }

  // ============ PAYSLIP METHODS ============

  async generatePayslip(institutionId, data, userId) {
    const { employeeId, month, year, workingDays, additionalEarnings, additionalDeductions } = data;

    // Check if payslip already exists
    const existing = await Payslip.findOne({ institutionId, employee: employeeId, month, year });
    if (existing) {
      throw new ApiError(400, 'Payslip already exists for this month');
    }

    // Get employee salary
    const empSalary = await EmployeeSalary.findOne({ employee: employeeId, institutionId });
    if (!empSalary) {
      throw new ApiError(400, 'Employee salary not configured');
    }

    // Generate payslip number
    const count = await Payslip.countDocuments({ institutionId });
    const payslipNumber = `PAY-${year}${String(month).padStart(2, '0')}-${String(count + 1).padStart(5, '0')}`;

    // Calculate earnings based on working days
    const totalWorkingDays = workingDays?.total || 30;
    const presentDays = workingDays?.present || totalWorkingDays;
    const lopDays = workingDays?.lop || 0;
    const ratio = (presentDays - lopDays) / totalWorkingDays;

    const earnings = {
      basic: Math.round((empSalary.components?.basic || 0) * ratio),
      hra: Math.round((empSalary.components?.hra || 0) * ratio),
      da: Math.round((empSalary.components?.da || 0) * ratio),
      ta: Math.round((empSalary.components?.ta || 0) * ratio),
      medical: Math.round((empSalary.components?.medical || 0) * ratio),
      special: Math.round((empSalary.components?.special || 0) * ratio),
      other: Math.round((empSalary.components?.other || 0) * ratio),
      bonus: additionalEarnings?.bonus || 0,
      overtime: additionalEarnings?.overtime || 0,
      arrears: additionalEarnings?.arrears || 0
    };

    // Get any pending bonuses for this month
    const bonuses = await Bonus.find({ 
      institutionId, 
      employee: employeeId, 
      month, 
      year, 
      status: 'approved' 
    });
    earnings.bonus += bonuses.reduce((sum, b) => sum + b.amount, 0);

    // Calculate LOP deduction
    const perDaySalary = empSalary.grossSalary / totalWorkingDays;
    const lopDeduction = Math.round(lopDays * perDaySalary);

    // Get active advances/loans
    const activeAdvances = await Advance.find({ 
      institutionId, 
      employee: employeeId, 
      status: { $in: ['disbursed', 'repaying'] } 
    });
    const advanceDeduction = activeAdvances.reduce((sum, a) => sum + (a.emiAmount || 0), 0);

    const deductions = {
      pf: empSalary.deductions?.pf || 0,
      esi: empSalary.deductions?.esi || 0,
      tax: empSalary.deductions?.tax || 0,
      lop: lopDeduction,
      advance: advanceDeduction,
      loan: additionalDeductions?.loan || 0,
      other: additionalDeductions?.other || 0
    };

    const payslip = new Payslip({
      institutionId,
      employee: employeeId,
      employeeSalary: empSalary._id,
      payslipNumber,
      month,
      year,
      payPeriod: {
        startDate: new Date(year, month - 1, 1),
        endDate: new Date(year, month, 0)
      },
      workingDays: workingDays || { total: 30, present: 30, leaves: 0, holidays: 0, lop: 0 },
      earnings,
      deductions,
      status: 'generated',
      generatedBy: userId
    });

    await payslip.save();

    // Update bonus status
    await Bonus.updateMany(
      { _id: { $in: bonuses.map(b => b._id) } },
      { $set: { status: 'paid', paidOn: new Date() } }
    );

    return payslip;
  }

  async getPayslips(institutionId, query = {}) {
    const { page = 1, limit = 10, month, year, status, employeeId } = query;
    const filter = { institutionId };
    
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const skip = (page - 1) * limit;
    const [payslips, total] = await Promise.all([
      Payslip.find(filter)
        .populate('employee', 'email profile role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payslip.countDocuments(filter)
    ]);

    return {
      payslips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getPayslipById(id, institutionId) {
    const payslip = await Payslip.findOne({ _id: id, institutionId })
      .populate('employee', 'email profile role')
      .populate('employeeSalary')
      .populate('approvedBy', 'profile');
    if (!payslip) throw new ApiError(404, 'Payslip not found');
    return payslip;
  }

  async approvePayslip(id, institutionId, userId) {
    const payslip = await Payslip.findOneAndUpdate(
      { _id: id, institutionId, status: 'generated' },
      { 
        $set: { 
          status: 'approved', 
          approvedBy: userId, 
          approvedAt: new Date() 
        } 
      },
      { new: true }
    );
    if (!payslip) throw new ApiError(404, 'Payslip not found or already processed');
    return payslip;
  }

  async markPayslipPaid(id, institutionId, paymentDetails) {
    const payslip = await Payslip.findOneAndUpdate(
      { _id: id, institutionId, status: 'approved' },
      { 
        $set: { 
          status: 'paid', 
          paymentDetails: {
            ...paymentDetails,
            paidOn: new Date()
          }
        } 
      },
      { new: true }
    );
    if (!payslip) throw new ApiError(404, 'Payslip not found or not approved');

    // Update advance installments
    const advances = await Advance.find({ 
      employee: payslip.employee, 
      status: { $in: ['disbursed', 'repaying'] } 
    });
    
    for (const advance of advances) {
      advance.paidInstallments += 1;
      advance.remainingAmount -= advance.emiAmount;
      if (advance.remainingAmount <= 0) {
        advance.status = 'completed';
        advance.remainingAmount = 0;
      } else {
        advance.status = 'repaying';
      }
      await advance.save();
    }

    return payslip;
  }

  // ============ BONUS METHODS ============

  async createBonus(institutionId, data, userId) {
    const bonus = new Bonus({
      ...data,
      institutionId,
      createdBy: userId
    });
    await bonus.save();
    return bonus;
  }

  async getBonuses(institutionId, query = {}) {
    const { page = 1, limit = 10, month, year, status, employeeId, type } = query;
    const filter = { institutionId };
    
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const [bonuses, total] = await Promise.all([
      Bonus.find(filter)
        .populate('employee', 'email profile role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Bonus.countDocuments(filter)
    ]);

    return {
      bonuses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async approveBonus(id, institutionId, userId, approved = true) {
    const status = approved ? 'approved' : 'rejected';
    const bonus = await Bonus.findOneAndUpdate(
      { _id: id, institutionId, status: 'pending' },
      { 
        $set: { 
          status, 
          approvedBy: userId, 
          approvedAt: new Date() 
        } 
      },
      { new: true }
    );
    if (!bonus) throw new ApiError(404, 'Bonus not found or already processed');
    return bonus;
  }

  // ============ ADVANCE/LOAN METHODS ============

  async createAdvance(institutionId, data, userId) {
    const advance = new Advance({
      ...data,
      institutionId,
      createdBy: userId
    });
    await advance.save();
    return advance;
  }

  async getAdvances(institutionId, query = {}) {
    const { page = 1, limit = 10, status, employeeId, type } = query;
    const filter = { institutionId };
    
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const [advances, total] = await Promise.all([
      Advance.find(filter)
        .populate('employee', 'email profile role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Advance.countDocuments(filter)
    ]);

    return {
      advances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async approveAdvance(id, institutionId, userId, approved = true) {
    const status = approved ? 'approved' : 'rejected';
    const advance = await Advance.findOneAndUpdate(
      { _id: id, institutionId, status: 'pending' },
      { 
        $set: { 
          status, 
          approvedBy: userId, 
          approvedAt: new Date() 
        } 
      },
      { new: true }
    );
    if (!advance) throw new ApiError(404, 'Advance not found or already processed');
    return advance;
  }

  async disburseAdvance(id, institutionId) {
    const advance = await Advance.findOneAndUpdate(
      { _id: id, institutionId, status: 'approved' },
      { 
        $set: { 
          status: 'disbursed', 
          disbursedOn: new Date() 
        } 
      },
      { new: true }
    );
    if (!advance) throw new ApiError(404, 'Advance not found or not approved');
    return advance;
  }

  // ============ STATS ============

  async getPayrollStats(institutionId) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    try {
      const instId = new mongoose.Types.ObjectId(institutionId);

      const [
        totalEmployees,
        configuredSalaries,
        monthlyBudget,
        currentMonthPayslips,
        pendingBonuses,
        activeAdvances,
        monthlyPayroll
      ] = await Promise.all([
        User.countDocuments({ 
          institution: instId, 
          role: { $in: ['teacher', 'staff', 'coordinator'] },
          isActive: true
        }),
        EmployeeSalary.countDocuments({ institutionId: instId, status: 'active' }),
        EmployeeSalary.aggregate([
          { $match: { institutionId: instId, status: 'active' } },
          { $group: { _id: null, total: { $sum: '$netSalary' } } }
        ]),
        Payslip.aggregate([
          { $match: { institutionId: instId, month: currentMonth, year: currentYear } },
          { $group: { 
            _id: '$status', 
            count: { $sum: 1 },
            total: { $sum: '$netSalary' }
          }}
        ]),
        Bonus.countDocuments({ institutionId: instId, status: 'pending' }),
        Advance.countDocuments({ institutionId: instId, status: { $in: ['disbursed', 'repaying'] } }),
        Payslip.aggregate([
          { $match: { institutionId: instId, status: 'paid', year: currentYear } },
          { $group: { 
            _id: '$month', 
            total: { $sum: '$netSalary' },
            count: { $sum: 1 }
          }},
          { $sort: { _id: 1 } }
        ])
      ]);

      const payslipStats = currentMonthPayslips.reduce((acc, item) => {
        acc[item._id] = { count: item.count, total: item.total };
        return acc;
      }, {});

      return {
        totalEmployees,
        configuredSalaries,
        pendingConfiguration: totalEmployees - configuredSalaries,
        monthlyBudget: monthlyBudget[0]?.total || 0,
        currentMonth: {
          generated: payslipStats.generated?.count || 0,
          approved: payslipStats.approved?.count || 0,
          paid: payslipStats.paid?.count || 0,
          totalPaid: payslipStats.paid?.total || 0
        },
        pendingBonuses,
        activeAdvances,
        monthlyPayroll: monthlyPayroll.map(m => ({
          month: m._id,
          total: m.total,
          count: m.count
        }))
      };
    } catch (error) {
      console.error('Error in getPayrollStats:', error);
      return {
        totalEmployees: 0,
        configuredSalaries: 0,
        pendingConfiguration: 0,
        currentMonth: { generated: 0, approved: 0, paid: 0, totalPaid: 0 },
        pendingBonuses: 0,
        activeAdvances: 0,
        monthlyPayroll: []
      };
    }
  }

  // Bulk generate payslips
  async bulkGeneratePayslips(institutionId, month, year, userId) {
    const employees = await EmployeeSalary.find({ institutionId, status: 'active' });
    const results = { success: 0, failed: 0, errors: [] };

    for (const emp of employees) {
      try {
        await this.generatePayslip(institutionId, {
          employeeId: emp.employee,
          month,
          year,
          workingDays: { total: 30, present: 30, leaves: 0, holidays: 0, lop: 0 }
        }, userId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ employeeId: emp.employee, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new PayrollService();
