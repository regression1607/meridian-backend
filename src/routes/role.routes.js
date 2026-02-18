const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { protect, authorize, authorizeMinRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get current user's permissions (any authenticated user)
router.get('/my-permissions', roleController.getMyPermissions);

// Get all roles (admins and coordinators)
router.get('/', authorizeMinRole('coordinator'), roleController.getRoles);

// Get role by ID
router.get('/:id', authorizeMinRole('coordinator'), roleController.getRoleById);

// Get users assigned to a role
router.get('/:id/users', authorizeMinRole('coordinator'), roleController.getUsersByRole);

// Create a new role (admin only)
router.post('/', authorize('super_admin', 'institution_admin'), roleController.createRole);

// Initialize default roles for institution (admin only)
router.post('/initialize', authorize('super_admin', 'institution_admin'), roleController.initializeDefaultRoles);

// Clone a role (admin only)
router.post('/:id/clone', authorize('super_admin', 'institution_admin'), roleController.cloneRole);

// Update a role (admin only)
router.put('/:id', authorize('super_admin', 'institution_admin'), roleController.updateRole);

// Update role permissions (admin only)
router.patch('/:id/permissions', authorize('super_admin', 'institution_admin'), roleController.updateRolePermissions);

// Delete a role (admin only)
router.delete('/:id', authorize('super_admin', 'institution_admin'), roleController.deleteRole);

module.exports = router;
