const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Stats & Calendar
router.get('/stats', protect, eventController.getEventStats);
router.get('/upcoming', protect, eventController.getUpcomingEvents);
router.get('/calendar', protect, eventController.getEventsByMonth);

// CRUD
router.post('/', protect, authorizeMinRole(ROLES.COORDINATOR), eventController.createEvent);
router.get('/', protect, eventController.getEvents);
router.get('/:id', protect, eventController.getEventById);
router.put('/:id', protect, authorizeMinRole(ROLES.COORDINATOR), eventController.updateEvent);
router.delete('/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), eventController.deleteEvent);

// Registration
router.post('/:id/register', protect, eventController.registerForEvent);
router.delete('/:id/register', protect, eventController.cancelRegistration);

module.exports = router;
