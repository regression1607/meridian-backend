const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/library.controller');
const { protect, authorizeMinRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Stats
router.get('/stats', protect, authorizeMinRole(ROLES.STAFF), libraryController.getStats);

// Settings
router.get('/settings', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), libraryController.getSettings);
router.put('/settings', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), libraryController.updateSettings);

// Book routes
router.post('/books', protect, authorizeMinRole(ROLES.STAFF), libraryController.createBook);
router.get('/books', protect, libraryController.getBooks);
router.get('/books/:id', protect, libraryController.getBookById);
router.put('/books/:id', protect, authorizeMinRole(ROLES.STAFF), libraryController.updateBook);
router.delete('/books/:id', protect, authorizeMinRole(ROLES.INSTITUTION_ADMIN), libraryController.deleteBook);

// Issue routes
router.post('/issues', protect, authorizeMinRole(ROLES.STAFF), libraryController.issueBook);
router.get('/issues', protect, libraryController.getIssuedBooks);
router.put('/issues/:id/return', protect, authorizeMinRole(ROLES.STAFF), libraryController.returnBook);
router.put('/issues/:id/renew', protect, libraryController.renewBook);
router.put('/issues/:id/lost', protect, authorizeMinRole(ROLES.STAFF), libraryController.markAsLost);

// Book request routes (for students)
router.post('/requests', protect, libraryController.createBookRequest);
router.get('/requests/me', protect, libraryController.getMyBookRequests);
router.get('/requests', protect, authorizeMinRole(ROLES.STAFF), libraryController.getBookRequests);
router.put('/requests/:id/approve', protect, authorizeMinRole(ROLES.STAFF), libraryController.approveBookRequest);
router.put('/requests/:id/reject', protect, authorizeMinRole(ROLES.STAFF), libraryController.rejectBookRequest);

module.exports = router;
