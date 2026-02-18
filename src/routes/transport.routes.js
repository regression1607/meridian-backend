const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transport.controller');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Stats
router.get('/stats', protect, checkPermission('transport', 'view'), transportController.getStats);

// Vehicle routes
router.post('/vehicles', protect, checkPermission('transport', 'create'), transportController.createVehicle);
router.get('/vehicles', protect, checkPermission('transport', 'view'), transportController.getVehicles);
router.get('/vehicles/:id', protect, checkPermission('transport', 'view'), transportController.getVehicleById);
router.put('/vehicles/:id', protect, checkPermission('transport', 'edit'), transportController.updateVehicle);
router.delete('/vehicles/:id', protect, checkPermission('transport', 'delete'), transportController.deleteVehicle);

// Route routes
router.post('/routes', protect, checkPermission('transport', 'create'), transportController.createRoute);
router.get('/routes', protect, checkPermission('transport', 'view'), transportController.getRoutes);
router.get('/routes/:id', protect, checkPermission('transport', 'view'), transportController.getRouteById);
router.put('/routes/:id', protect, checkPermission('transport', 'edit'), transportController.updateRoute);
router.delete('/routes/:id', protect, checkPermission('transport', 'delete'), transportController.deleteRoute);

// Allocation routes
router.post('/allocations', protect, checkPermission('transport', 'create'), transportController.allocateTransport);
router.get('/allocations', protect, checkPermission('transport', 'view'), transportController.getAllocations);
router.put('/allocations/:id', protect, checkPermission('transport', 'edit'), transportController.updateAllocation);
router.delete('/allocations/:id', protect, checkPermission('transport', 'delete'), transportController.deleteAllocation);

module.exports = router;
