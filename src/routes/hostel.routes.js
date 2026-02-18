const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostel.controller');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Stats
router.get('/stats', protect, checkPermission('hostel', 'view'), hostelController.getStats);

// Block routes
router.post('/blocks', protect, checkPermission('hostel', 'create'), hostelController.createBlock);
router.get('/blocks', protect, checkPermission('hostel', 'view'), hostelController.getBlocks);
router.get('/blocks/:id', protect, checkPermission('hostel', 'view'), hostelController.getBlockById);
router.put('/blocks/:id', protect, checkPermission('hostel', 'edit'), hostelController.updateBlock);
router.delete('/blocks/:id', protect, checkPermission('hostel', 'delete'), hostelController.deleteBlock);

// Room routes
router.post('/rooms', protect, checkPermission('hostel', 'create'), hostelController.createRoom);
router.get('/rooms', protect, checkPermission('hostel', 'view'), hostelController.getRooms);
router.get('/rooms/:id', protect, checkPermission('hostel', 'view'), hostelController.getRoomById);
router.put('/rooms/:id', protect, checkPermission('hostel', 'edit'), hostelController.updateRoom);
router.delete('/rooms/:id', protect, checkPermission('hostel', 'delete'), hostelController.deleteRoom);

// Allocation routes
router.post('/allocations', protect, checkPermission('hostel', 'create'), hostelController.allocateRoom);
router.get('/allocations', protect, checkPermission('hostel', 'view'), hostelController.getAllocations);
router.put('/allocations/:id/vacate', protect, checkPermission('hostel', 'edit'), hostelController.vacateRoom);

// Mess Menu routes
router.post('/mess-menu', protect, checkPermission('hostel', 'create'), hostelController.createMessMenu);
router.get('/mess-menu', protect, checkPermission('hostel', 'view'), hostelController.getMessMenu);
router.put('/mess-menu/:id', protect, checkPermission('hostel', 'edit'), hostelController.updateMessMenu);
router.delete('/mess-menu/:id', protect, checkPermission('hostel', 'delete'), hostelController.deleteMessMenu);

// Visitor Log routes
router.post('/visitors', protect, checkPermission('hostel', 'create'), hostelController.createVisitorLog);
router.get('/visitors', protect, checkPermission('hostel', 'view'), hostelController.getVisitorLogs);
router.put('/visitors/:id/checkout', protect, checkPermission('hostel', 'edit'), hostelController.checkOutVisitor);

// Complaint routes
router.post('/complaints', protect, checkPermission('hostel', 'view'), hostelController.createComplaint);
router.get('/complaints', protect, checkPermission('hostel', 'view'), hostelController.getComplaints);
router.put('/complaints/:id', protect, checkPermission('hostel', 'edit'), hostelController.updateComplaint);
router.delete('/complaints/:id', protect, checkPermission('hostel', 'delete'), hostelController.deleteComplaint);

module.exports = router;
