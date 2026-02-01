const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transport.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Stats
router.get('/stats', protect, authorizeMinRole(ROLES.STAFF), transportController.getStats);

// Vehicle routes
router.post('/vehicles', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), transportController.createVehicle);
router.get('/vehicles', protect, authorizeMinRole(ROLES.STAFF), transportController.getVehicles);
router.get('/vehicles/:id', protect, authorizeMinRole(ROLES.STAFF), transportController.getVehicleById);
router.put('/vehicles/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), transportController.updateVehicle);
router.delete('/vehicles/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), transportController.deleteVehicle);

// Route routes
router.post('/routes', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), transportController.createRoute);
router.get('/routes', protect, transportController.getRoutes);
router.get('/routes/:id', protect, transportController.getRouteById);
router.put('/routes/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), transportController.updateRoute);
router.delete('/routes/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), transportController.deleteRoute);

// Allocation routes
router.post('/allocations', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), transportController.allocateTransport);
router.get('/allocations', protect, authorizeMinRole(ROLES.STAFF), transportController.getAllocations);
router.put('/allocations/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), transportController.updateAllocation);
router.delete('/allocations/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), transportController.deleteAllocation);

module.exports = router;
