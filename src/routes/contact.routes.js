const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contact.controller');

// POST /api/v1/contact - Submit contact form (public)
router.post('/', submitContactForm);

module.exports = router;
