const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institution.controller');
const { protect, authorize, isPlatformAdmin } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Public route - Get institutions list for admission form
router.get('/public', institutionController.getPublicInstitutions);

// All other routes require authentication
router.use(protect);

// Routes for current user's institution
router.get('/me', institutionController.getMyInstitution);
router.put('/me', authorize(ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN), institutionController.updateMyInstitution);
router.get('/me/stats', institutionController.getMyInstitutionStats);
router.get('/dashboard', institutionController.getDashboardStats);

// Platform admin routes (super_admin and admin)
router.get('/', isPlatformAdmin, institutionController.getInstitutions);
router.post('/', isPlatformAdmin, institutionController.createInstitution);
router.get('/:id', isPlatformAdmin, institutionController.getInstitutionById);
router.put('/:id', isPlatformAdmin, institutionController.updateInstitution);
router.get('/:id/stats', isPlatformAdmin, institutionController.getInstitutionStats);

module.exports = router;
