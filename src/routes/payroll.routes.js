const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Stats
router.get('/stats', protect, checkPermission('payroll', 'view'), payrollController.getStats);

// Salary Structure routes
router.post('/structures', protect, checkPermission('payroll', 'create'), payrollController.createSalaryStructure);
router.get('/structures', protect, checkPermission('payroll', 'view'), payrollController.getSalaryStructures);
router.get('/structures/:id', protect, checkPermission('payroll', 'view'), payrollController.getSalaryStructureById);
router.put('/structures/:id', protect, checkPermission('payroll', 'edit'), payrollController.updateSalaryStructure);
router.delete('/structures/:id', protect, checkPermission('payroll', 'delete'), payrollController.deleteSalaryStructure);

// Employee Salary routes
router.post('/salaries', protect, checkPermission('payroll', 'create'), payrollController.assignEmployeeSalary);
router.get('/salaries', protect, checkPermission('payroll', 'view'), payrollController.getEmployeeSalaries);
router.get('/salaries/me', protect, payrollController.getMyEmployeeSalary);
router.get('/salaries/:id', protect, checkPermission('payroll', 'view'), payrollController.getEmployeeSalaryById);
router.put('/salaries/:id', protect, checkPermission('payroll', 'edit'), payrollController.updateEmployeeSalary);
router.delete('/salaries/:id', protect, checkPermission('payroll', 'delete'), payrollController.deleteEmployeeSalary);

// Payslip routes
router.post('/payslips', protect, checkPermission('payroll', 'create'), payrollController.generatePayslip);
router.post('/payslips/bulk', protect, checkPermission('payroll', 'manage'), payrollController.bulkGeneratePayslips);
router.get('/payslips', protect, checkPermission('payroll', 'view'), payrollController.getPayslips);
router.get('/payslips/me', protect, payrollController.getMyPayslips);
router.get('/payslips/:id', protect, payrollController.getPayslipById);
router.put('/payslips/:id/approve', protect, checkPermission('payroll', 'manage'), payrollController.approvePayslip);
router.put('/payslips/:id/pay', protect, checkPermission('payroll', 'manage'), payrollController.markPayslipPaid);

// Bonus routes
router.post('/bonuses', protect, checkPermission('payroll', 'create'), payrollController.createBonus);
router.get('/bonuses', protect, checkPermission('payroll', 'view'), payrollController.getBonuses);
router.put('/bonuses/:id/approve', protect, checkPermission('payroll', 'manage'), payrollController.approveBonus);

// Advance/Loan routes
router.post('/advances', protect, payrollController.createAdvance);
router.get('/advances', protect, checkPermission('payroll', 'view'), payrollController.getAdvances);
router.put('/advances/:id/approve', protect, checkPermission('payroll', 'manage'), payrollController.approveAdvance);
router.put('/advances/:id/disburse', protect, checkPermission('payroll', 'manage'), payrollController.disburseAdvance);

module.exports = router;
