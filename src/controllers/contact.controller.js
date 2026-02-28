const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * Submit contact form
 * @route POST /api/v1/contact
 * @access Public
 */
const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, institution, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, subject, and message'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if email service is configured
    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    if (!smtpConfigured) {
      logger.error('SMTP not configured. Missing env vars.');
      return res.status(500).json({
        success: false,
        message: 'Email service not configured. Please contact us directly at ekanshrajput1607@gmail.com'
      });
    }

    // Send contact form email
    const result = await emailService.sendContactForm({
      name,
      email,
      phone,
      institution,
      subject,
      message
    });

    if (result.success) {
      logger.info(`Contact form submitted by ${name} (${email})`);
      return res.status(200).json({
        success: true,
        message: 'Thank you for your message! We will get back to you within 24 hours.'
      });
    } else {
      logger.error(`Failed to send contact form email: ${result.message}`);
      return res.status(500).json({
        success: false,
        message: `Failed to send message: ${result.message}. Please email us directly at ekanshrajput1607@gmail.com`
      });
    }
  } catch (error) {
    logger.error('Contact form error:', error);
    return res.status(500).json({
      success: false,
      message: `Error: ${error.message}. Please email us directly at ekanshrajput1607@gmail.com`
    });
  }
};

module.exports = {
  submitContactForm
};
