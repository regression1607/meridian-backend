const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      logger.warn('Email service not configured. Missing SMTP credentials.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT) || 587,
      secure: parseInt(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    this.fromEmail = SMTP_FROM || SMTP_USER;
    this.initialized = true;
    logger.info('Email service initialized successfully');
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.transporter) {
      logger.warn('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"Meridian EMS" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return { success: false, message: error.message };
    }
  }

  async sendOTP({ to, otp, name = 'User', expiresIn = '10 minutes' }) {
    const subject = 'Your OTP for Meridian EMS';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 OTP Verification</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #666; font-size: 15px; line-height: 1.6;">Your One-Time Password (OTP) for Meridian EMS verification is:</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <span style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              ⏱️ This OTP is valid for <strong>${expiresIn}</strong>.<br>
              🔒 Do not share this code with anyone.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't request this OTP, please ignore this email or contact support.
            </p>
          </div>
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} Meridian EMS. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendPasswordReset({ to, resetLink, name = 'User', expiresIn = '1 hour' }) {
    const subject = 'Reset Your Password - Meridian EMS';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Password Reset</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #666; font-size: 15px; line-height: 1.6;">We received a request to reset your password for your Meridian EMS account. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 40px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              ⏱️ This link will expire in <strong>${expiresIn}</strong>.<br>
              🔒 If you didn't request this, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              Or copy this link: <br>
              <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't request a password reset, your account is still secure.
            </p>
          </div>
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} Meridian EMS. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendWelcome({ to, name, email, password, loginUrl, profileUrl }) {
    const subject = 'Welcome to Meridian EMS - Your Account Details';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const finalLoginUrl = loginUrl || `${frontendUrl}/login`;
    const finalProfileUrl = profileUrl || `${frontendUrl}/dashboard/profile`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Meridian EMS</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Meridian EMS!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #666; font-size: 15px; line-height: 1.6;">Your account has been created successfully. Here are your login credentials:</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #11998e;">
              <p style="margin: 0 0 10px 0; color: #333;">
                <strong>📧 Email:</strong> ${email}
              </p>
              <p style="margin: 0; color: #333;">
                <strong>🔑 Password:</strong> ${password}
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${finalLoginUrl}" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 15px 40px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px;">Login Now</a>
            </div>
            <div style="background: #fff3cd; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0 0 15px 0; color: #856404; font-size: 14px;">
                ⚠️ <strong>Important Security Notice:</strong>
              </p>
              <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px;">
                Please change your password after your first login for security purposes.
              </p>
              <p style="margin: 0; color: #856404; font-size: 14px;">
                To change your password:
              </p>
              <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #856404; font-size: 14px;">
                <li>Go to your <a href="${finalProfileUrl}" style="color: #11998e; font-weight: bold;">Profile Settings</a></li>
                <li>Navigate to the <strong>Security</strong> tab</li>
                <li>Enable <strong>Two-Factor Authentication (2FA)</strong></li>
                <li>Click <strong>Change Password</strong> and verify with OTP</li>
              </ol>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${finalProfileUrl}" style="display: inline-block; background: #6c757d; color: white; padding: 12px 30px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px;">Go to Profile Settings</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Need help? Contact your administrator or reply to this email.
            </p>
          </div>
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} Meridian EMS. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendPasswordChanged({ to, name = 'User' }) {
    const subject = 'Password Changed Successfully - Meridian EMS';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Password Changed</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #666; font-size: 15px; line-height: 1.6;">Your password has been changed successfully on ${new Date().toLocaleString()}.</p>
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724;">
                🔒 Your account is now secured with the new password.
              </p>
            </div>
            <p style="color: #e74c3c; font-size: 14px; line-height: 1.6;">
              ⚠️ If you didn't make this change, please contact support immediately and secure your account.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated security notification.
            </p>
          </div>
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} Meridian EMS. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendContactForm({ name, email, phone, institution, subject, message }) {
    const adminEmail = process.env.CONTACT_FORM_EMAIL || process.env.SMTP_USER;
    const subjectLine = `New Contact Form: ${subject} - from ${name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📬 New Contact Form Submission</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Contact Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Name:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; color: #333;"><a href="mailto:${email}" style="color: #667eea;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${phone || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Institution:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${institution || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Subject:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${subject}</td>
                </tr>
              </table>
            </div>
            <div style="background: #e8f4f8; padding: 20px; border-radius: 12px; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">Message:</h3>
              <p style="color: #555; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <div style="text-align: center;">
              <a href="mailto:${email}?subject=Re: ${subject}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px;">Reply to ${name}</a>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              Received on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
            </p>
          </div>
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} Meridian EMS. Contact Form Notification.
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: adminEmail, subject: subjectLine, html });
  }

  async verifyConnection() {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return { success: true, message: 'Email service connected' };
    } catch (error) {
      logger.error('Email service verification failed:', error);
      return { success: false, message: error.message };
    }
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService;
