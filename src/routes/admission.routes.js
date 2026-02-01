const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admission.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Public route - Submit application
router.post('/apply', admissionController.submitApplication);

// Protected routes - Require authentication
router.use(protect);

// Application routes
router.get('/applications', 
  authorizeMinRole(ROLES.STAFF), 
  admissionController.getApplications
);

router.get('/applications/:id', 
  authorizeMinRole(ROLES.STAFF), 
  admissionController.getApplicationById
);

router.put('/applications/:id', 
  authorizeMinRole(ROLES.STAFF), 
  admissionController.updateApplication
);

router.put('/applications/:id/status', 
  authorizeMinRole(ROLES.INSTITUTION_ADMIN), 
  admissionController.updateApplicationStatus
);

router.delete('/applications/:id', 
  authorizeMinRole(ROLES.INSTITUTION_ADMIN), 
  admissionController.deleteApplication
);

// Entrance test routes
router.put('/applications/:id/entrance-test', 
  authorizeMinRole(ROLES.STAFF), 
  admissionController.scheduleEntranceTest
);

router.put('/applications/:id/entrance-test/score', 
  authorizeMinRole(ROLES.STAFF), 
  admissionController.updateEntranceTestScore
);

// Enrollment routes
router.post('/enroll/:id', 
  authorizeMinRole(ROLES.INSTITUTION_ADMIN), 
  admissionController.enrollStudent
);

router.get('/enrollments', 
  authorizeMinRole(ROLES.STAFF), 
  admissionController.getEnrollments
);

router.get('/enrollments/:id', 
  authorizeMinRole(ROLES.STAFF), 
  admissionController.getEnrollmentById
);

// Statistics
router.get('/stats', 
  authorizeMinRole(ROLES.STAFF), 
  admissionController.getAdmissionStats
);

module.exports = router;
