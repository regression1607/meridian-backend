const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Stats
router.get('/stats', protect, authorizeMinRole(ROLES.STAFF), payrollController.getStats);

// Salary Structure routes
router.post('/structures', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.createSalaryStructure);
router.get('/structures', protect, authorizeMinRole(ROLES.STAFF), payrollController.getSalaryStructures);
router.get('/structures/:id', protect, authorizeMinRole(ROLES.STAFF), payrollController.getSalaryStructureById);
router.put('/structures/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.updateSalaryStructure);
router.delete('/structures/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.deleteSalaryStructure);

// Employee Salary routes
router.post('/salaries', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.assignEmployeeSalary);
router.get('/salaries', protect, authorizeMinRole(ROLES.STAFF), payrollController.getEmployeeSalaries);
router.get('/salaries/me', protect, payrollController.getMyEmployeeSalary);
router.get('/salaries/:id', protect, authorizeMinRole(ROLES.STAFF), payrollController.getEmployeeSalaryById);
router.put('/salaries/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.updateEmployeeSalary);
router.delete('/salaries/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.deleteEmployeeSalary);

// Payslip routes
router.post('/payslips', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.generatePayslip);
router.post('/payslips/bulk', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.bulkGeneratePayslips);
router.get('/payslips', protect, authorizeMinRole(ROLES.STAFF), payrollController.getPayslips);
router.get('/payslips/me', protect, payrollController.getMyPayslips);
router.get('/payslips/:id', protect, payrollController.getPayslipById);
router.put('/payslips/:id/approve', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.approvePayslip);
router.put('/payslips/:id/pay', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.markPayslipPaid);

// Bonus routes
router.post('/bonuses', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.createBonus);
router.get('/bonuses', protect, authorizeMinRole(ROLES.STAFF), payrollController.getBonuses);
router.put('/bonuses/:id/approve', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.approveBonus);

// Advance/Loan routes
router.post('/advances', protect, payrollController.createAdvance);
router.get('/advances', protect, authorizeMinRole(ROLES.STAFF), payrollController.getAdvances);
router.put('/advances/:id/approve', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.approveAdvance);
router.put('/advances/:id/disburse', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), payrollController.disburseAdvance);

module.exports = router;
