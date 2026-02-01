const payrollService = require('../services/payroll.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const getInstitutionId = (req) => {
  return req.user?.institution || req.query.institutionId || req.body.institutionId;
};

const payrollController = {
  // ============ SALARY STRUCTURE CONTROLLERS ============
  createSalaryStructure: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const structure = await payrollService.createSalaryStructure(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Salary structure created successfully', structure));
  }),

  getSalaryStructures: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await payrollService.getSalaryStructures(institutionId, req.query);
    res.json(ApiResponse.paginated('Salary structures fetched successfully', result.structures, result.pagination));
  }),

  getSalaryStructureById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const structure = await payrollService.getSalaryStructureById(req.params.id, institutionId);
    res.json(ApiResponse.success('Salary structure fetched successfully', structure));
  }),

  updateSalaryStructure: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const structure = await payrollService.updateSalaryStructure(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Salary structure updated successfully', structure));
  }),

  deleteSalaryStructure: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await payrollService.deleteSalaryStructure(req.params.id, institutionId);
    res.json(ApiResponse.success('Salary structure deleted successfully', null));
  }),

  // ============ EMPLOYEE SALARY CONTROLLERS ============
  assignEmployeeSalary: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const salary = await payrollService.assignEmployeeSalary(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Employee salary assigned successfully', salary));
  }),

  getEmployeeSalaries: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await payrollService.getEmployeeSalaries(institutionId, req.query);
    res.json(ApiResponse.paginated('Employee salaries fetched successfully', result.salaries, result.pagination));
  }),

  getEmployeeSalaryById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const salary = await payrollService.getEmployeeSalaryById(req.params.id, institutionId);
    res.json(ApiResponse.success('Employee salary fetched successfully', salary));
  }),

  getMyEmployeeSalary: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const salary = await payrollService.getEmployeeSalaryByEmployee(req.user._id, institutionId);
    res.json(ApiResponse.success('Salary fetched successfully', salary));
  }),

  // ============ PAYSLIP CONTROLLERS ============
  generatePayslip: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const payslip = await payrollService.generatePayslip(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Payslip generated successfully', payslip));
  }),

  bulkGeneratePayslips: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const { month, year } = req.body;
    const result = await payrollService.bulkGeneratePayslips(institutionId, month, year, req.user._id);
    res.json(ApiResponse.success('Bulk payslips generation completed', result));
  }),

  getPayslips: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await payrollService.getPayslips(institutionId, req.query);
    res.json(ApiResponse.paginated('Payslips fetched successfully', result.payslips, result.pagination));
  }),

  getPayslipById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const payslip = await payrollService.getPayslipById(req.params.id, institutionId);
    res.json(ApiResponse.success('Payslip fetched successfully', payslip));
  }),

  getMyPayslips: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await payrollService.getPayslips(institutionId, { ...req.query, employeeId: req.user._id });
    res.json(ApiResponse.paginated('Payslips fetched successfully', result.payslips, result.pagination));
  }),

  approvePayslip: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const payslip = await payrollService.approvePayslip(req.params.id, institutionId, req.user._id);
    res.json(ApiResponse.success('Payslip approved successfully', payslip));
  }),

  markPayslipPaid: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const payslip = await payrollService.markPayslipPaid(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Payslip marked as paid', payslip));
  }),

  // ============ BONUS CONTROLLERS ============
  createBonus: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const bonus = await payrollService.createBonus(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Bonus created successfully', bonus));
  }),

  getBonuses: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await payrollService.getBonuses(institutionId, req.query);
    res.json(ApiResponse.paginated('Bonuses fetched successfully', result.bonuses, result.pagination));
  }),

  approveBonus: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const { approved } = req.body;
    const bonus = await payrollService.approveBonus(req.params.id, institutionId, req.user._id, approved !== false);
    res.json(ApiResponse.success('Bonus processed successfully', bonus));
  }),

  // ============ ADVANCE/LOAN CONTROLLERS ============
  createAdvance: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const advance = await payrollService.createAdvance(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Advance/Loan request created successfully', advance));
  }),

  getAdvances: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await payrollService.getAdvances(institutionId, req.query);
    res.json(ApiResponse.paginated('Advances fetched successfully', result.advances, result.pagination));
  }),

  approveAdvance: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const { approved } = req.body;
    const advance = await payrollService.approveAdvance(req.params.id, institutionId, req.user._id, approved !== false);
    res.json(ApiResponse.success('Advance processed successfully', advance));
  }),

  disburseAdvance: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const advance = await payrollService.disburseAdvance(req.params.id, institutionId);
    res.json(ApiResponse.success('Advance disbursed successfully', advance));
  }),

  // ============ STATS ============
  getStats: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const stats = await payrollService.getPayrollStats(institutionId);
    res.json(ApiResponse.success('Payroll stats fetched successfully', stats));
  })
};

module.exports = payrollController;
