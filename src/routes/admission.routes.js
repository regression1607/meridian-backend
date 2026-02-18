const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admission.controller');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Public route - Submit application
router.post('/apply', admissionController.submitApplication);

// Protected routes - Require authentication
router.use(protect);

// Application routes
router.get('/applications', 
  checkPermission('admissions', 'view'), 
  admissionController.getApplications
);

router.get('/applications/:id', 
  checkPermission('admissions', 'view'), 
  admissionController.getApplicationById
);

router.put('/applications/:id', 
  checkPermission('admissions', 'edit'), 
  admissionController.updateApplication
);

router.put('/applications/:id/status', 
  checkPermission('admissions', 'manage'), 
  admissionController.updateApplicationStatus
);

router.delete('/applications/:id', 
  checkPermission('admissions', 'delete'), 
  admissionController.deleteApplication
);

// Entrance test routes
router.put('/applications/:id/entrance-test', 
  checkPermission('admissions', 'edit'), 
  admissionController.scheduleEntranceTest
);

router.put('/applications/:id/entrance-test/score', 
  checkPermission('admissions', 'edit'), 
  admissionController.updateEntranceTestScore
);

// Enrollment routes
router.post('/enroll/:id', 
  checkPermission('admissions', 'manage'), 
  admissionController.enrollStudent
);

router.get('/enrollments', 
  checkPermission('admissions', 'view'), 
  admissionController.getEnrollments
);

router.get('/enrollments/:id', 
  checkPermission('admissions', 'view'), 
  admissionController.getEnrollmentById
);

// Statistics
router.get('/stats', 
  checkPermission('admissions', 'view'), 
  admissionController.getAdmissionStats
);

module.exports = router;
