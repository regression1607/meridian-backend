const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Stats & Calendar
router.get('/stats', protect, checkPermission('events', 'view'), eventController.getEventStats);
router.get('/upcoming', protect, checkPermission('events', 'view'), eventController.getUpcomingEvents);
router.get('/calendar', protect, checkPermission('events', 'view'), eventController.getEventsByMonth);

// CRUD
router.post('/', protect, checkPermission('events', 'create'), eventController.createEvent);
router.get('/', protect, checkPermission('events', 'view'), eventController.getEvents);
router.get('/:id', protect, checkPermission('events', 'view'), eventController.getEventById);
router.put('/:id', protect, checkPermission('events', 'edit'), eventController.updateEvent);
router.delete('/:id', protect, checkPermission('events', 'delete'), eventController.deleteEvent);

// Registration
router.post('/:id/register', protect, checkPermission('events', 'view'), eventController.registerForEvent);
router.delete('/:id/register', protect, checkPermission('events', 'view'), eventController.cancelRegistration);

module.exports = router;
