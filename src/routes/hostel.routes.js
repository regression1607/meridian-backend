const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostel.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Stats
router.get('/stats', protect, authorizeMinRole(ROLES.STAFF), hostelController.getStats);

// Block routes
router.post('/blocks', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), hostelController.createBlock);
router.get('/blocks', protect, authorizeMinRole(ROLES.STAFF), hostelController.getBlocks);
router.get('/blocks/:id', protect, authorizeMinRole(ROLES.STAFF), hostelController.getBlockById);
router.put('/blocks/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), hostelController.updateBlock);
router.delete('/blocks/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), hostelController.deleteBlock);

// Room routes
router.post('/rooms', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), hostelController.createRoom);
router.get('/rooms', protect, authorizeMinRole(ROLES.STAFF), hostelController.getRooms);
router.get('/rooms/:id', protect, authorizeMinRole(ROLES.STAFF), hostelController.getRoomById);
router.put('/rooms/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), hostelController.updateRoom);
router.delete('/rooms/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), hostelController.deleteRoom);

// Allocation routes
router.post('/allocations', protect, authorizeMinRole(ROLES.STAFF), hostelController.allocateRoom);
router.get('/allocations', protect, authorizeMinRole(ROLES.STAFF), hostelController.getAllocations);
router.put('/allocations/:id/vacate', protect, authorizeMinRole(ROLES.STAFF), hostelController.vacateRoom);

// Mess Menu routes
router.post('/mess-menu', protect, authorizeMinRole(ROLES.STAFF), hostelController.createMessMenu);
router.get('/mess-menu', protect, hostelController.getMessMenu);
router.put('/mess-menu/:id', protect, authorizeMinRole(ROLES.STAFF), hostelController.updateMessMenu);
router.delete('/mess-menu/:id', protect, authorizeMinRole(ROLES.STAFF), hostelController.deleteMessMenu);

// Visitor Log routes
router.post('/visitors', protect, authorizeMinRole(ROLES.STAFF), hostelController.createVisitorLog);
router.get('/visitors', protect, authorizeMinRole(ROLES.STAFF), hostelController.getVisitorLogs);
router.put('/visitors/:id/checkout', protect, authorizeMinRole(ROLES.STAFF), hostelController.checkOutVisitor);

// Complaint routes
router.post('/complaints', protect, hostelController.createComplaint);
router.get('/complaints', protect, hostelController.getComplaints);
router.put('/complaints/:id', protect, authorizeMinRole(ROLES.STAFF), hostelController.updateComplaint);
router.delete('/complaints/:id', protect, authorizeMinRole(ROLES.STAFF), hostelController.deleteComplaint);

module.exports = router;
