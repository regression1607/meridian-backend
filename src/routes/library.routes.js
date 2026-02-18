const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/library.controller');
const { protect, authorizeMinRole, checkPermission } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Stats
router.get('/stats', protect, checkPermission('library', 'view'), libraryController.getStats);

// Settings
router.get('/settings', protect, checkPermission('library', 'manage'), libraryController.getSettings);
router.put('/settings', protect, checkPermission('library', 'manage'), libraryController.updateSettings);

// Book routes
router.post('/books', protect, checkPermission('library', 'create'), libraryController.createBook);
router.get('/books', protect, checkPermission('library', 'view'), libraryController.getBooks);
router.get('/books/:id', protect, checkPermission('library', 'view'), libraryController.getBookById);
router.put('/books/:id', protect, checkPermission('library', 'edit'), libraryController.updateBook);
router.delete('/books/:id', protect, checkPermission('library', 'delete'), libraryController.deleteBook);

// Issue routes
router.post('/issues', protect, checkPermission('library', 'create'), libraryController.issueBook);
router.get('/issues', protect, checkPermission('library', 'view'), libraryController.getIssuedBooks);
router.put('/issues/:id/return', protect, checkPermission('library', 'edit'), libraryController.returnBook);
router.put('/issues/:id/renew', protect, checkPermission('library', 'view'), libraryController.renewBook);
router.put('/issues/:id/lost', protect, checkPermission('library', 'edit'), libraryController.markAsLost);

// Book request routes (for students)
router.post('/requests', protect, checkPermission('library', 'view'), libraryController.createBookRequest);
router.get('/requests/me', protect, checkPermission('library', 'view'), libraryController.getMyBookRequests);
router.get('/requests', protect, checkPermission('library', 'manage'), libraryController.getBookRequests);
router.put('/requests/:id/approve', protect, checkPermission('library', 'manage'), libraryController.approveBookRequest);
router.put('/requests/:id/reject', protect, checkPermission('library', 'manage'), libraryController.rejectBookRequest);

module.exports = router;
