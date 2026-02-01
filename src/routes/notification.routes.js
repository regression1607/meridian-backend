const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// User routes
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/:id', notificationController.getNotificationById);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/read', notificationController.deleteAllRead);
router.delete('/:id', notificationController.deleteNotification);

// Admin routes - send notifications
router.post('/', authorizeMinRole(ROLES.INSTITUTION_ADMIN), notificationController.createNotification);
router.post('/send-to-role', authorizeMinRole(ROLES.INSTITUTION_ADMIN), notificationController.sendToRole);
router.post('/send-to-class', authorizeMinRole(ROLES.TEACHER), notificationController.sendToClass);

module.exports = router;
