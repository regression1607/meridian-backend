const feeService = require('../services/fee.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

// Fee Structure
exports.createFeeStructure = asyncHandler(async (req, res) => {
  const structure = await feeService.createFeeStructure(req.body, req.user.institution);
  res.status(201).json(ApiResponse.created('Fee structure created', structure));
});

exports.getFeeStructures = asyncHandler(async (req, res) => {
  const structures = await feeService.getFeeStructures(req.user.institution, req.query);
  res.json(ApiResponse.success('Fee structures fetched', structures));
});

exports.updateFeeStructure = asyncHandler(async (req, res) => {
  const structure = await feeService.updateFeeStructure(req.params.id, req.body, req.user.institution);
  res.json(ApiResponse.success('Fee structure updated', structure));
});

// Fee Payments
exports.recordPayment = asyncHandler(async (req, res) => {
  const payment = await feeService.recordPayment(req.body, req.user.institution, req.user._id);
  res.status(201).json(ApiResponse.created('Payment recorded', payment));
});

exports.getFeePayments = asyncHandler(async (req, res) => {
  const result = await feeService.getFeePayments(req.user.institution, req.query);
  res.json(ApiResponse.paginated('Fee payments fetched', result.data, result.meta));
});

exports.getStudentFees = asyncHandler(async (req, res) => {
  const result = await feeService.getStudentFees(req.params.studentId, req.user.institution);
  res.json(ApiResponse.success('Student fees fetched', result));
});

exports.getMyFees = asyncHandler(async (req, res) => {
  const result = await feeService.getStudentFees(req.user._id, req.user.institution);
  res.json(ApiResponse.success('Your fees fetched', result));
});

exports.getFeeStats = asyncHandler(async (req, res) => {
  const stats = await feeService.getFeeStats(req.user.institution, req.query);
  res.json(ApiResponse.success('Fee stats fetched', stats));
});

exports.getDefaulters = asyncHandler(async (req, res) => {
  const defaulters = await feeService.getDefaulters(req.user.institution, req.query);
  res.json(ApiResponse.success('Defaulters fetched', defaulters));
});
