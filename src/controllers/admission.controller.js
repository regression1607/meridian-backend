const admissionService = require('../services/admission.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const getInstitutionId = (req) => {
  return req.user?.institution || req.query.institutionId || req.body.institutionId;
};

const admissionController = {
  // Submit new application (public endpoint)
  submitApplication: asyncHandler(async (req, res) => {
    const institutionId = req.body.institutionId;
    if (!institutionId) {
      return res.status(400).json(ApiResponse.error('Institution ID is required'));
    }
    
    const application = await admissionService.submitApplication(req.body, institutionId);
    res.status(201).json(ApiResponse.success('Application submitted successfully', application));
  }),

  // Get all applications
  getApplications: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await admissionService.getApplications(institutionId, req.query);
    res.json(ApiResponse.paginated('Applications fetched successfully', result.applications, result.pagination));
  }),

  // Get single application
  getApplicationById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const application = await admissionService.getApplicationById(req.params.id, institutionId);
    res.json(ApiResponse.success('Application fetched successfully', application));
  }),

  // Update application status
  updateApplicationStatus: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const application = await admissionService.updateApplicationStatus(
      req.params.id, 
      institutionId, 
      req.body,
      req.user._id
    );
    res.json(ApiResponse.success('Application status updated successfully', application));
  }),

  // Update application details
  updateApplication: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const application = await admissionService.updateApplication(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Application updated successfully', application));
  }),

  // Enroll student
  enrollStudent: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await admissionService.enrollStudent(
      req.params.id, 
      institutionId, 
      req.body,
      req.user._id
    );
    res.status(201).json(ApiResponse.success('Student enrolled successfully', result));
  }),

  // Get enrollment by ID
  getEnrollmentById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const enrollment = await admissionService.getEnrollmentById(req.params.id, institutionId);
    res.json(ApiResponse.success('Enrollment fetched successfully', enrollment));
  }),

  // Get all enrollments
  getEnrollments: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await admissionService.getEnrollments(institutionId, req.query);
    res.json(ApiResponse.paginated('Enrollments fetched successfully', result.enrollments, result.pagination));
  }),

  // Get admission statistics
  getAdmissionStats: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const stats = await admissionService.getAdmissionStats(institutionId, req.query.academicYear);
    res.json(ApiResponse.success('Admission statistics fetched successfully', stats));
  }),

  // Delete application
  deleteApplication: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await admissionService.deleteApplication(req.params.id, institutionId);
    res.json(ApiResponse.success('Application deleted successfully', null));
  }),

  // Schedule entrance test
  scheduleEntranceTest: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const application = await admissionService.scheduleEntranceTest(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Entrance test scheduled successfully', application));
  }),

  // Update entrance test score
  updateEntranceTestScore: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const application = await admissionService.updateEntranceTestScore(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Entrance test score updated successfully', application));
  })
};

module.exports = admissionController;
