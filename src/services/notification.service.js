const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('../utils/emailService');

exports.getNotifications = async (userId, institutionId, query = {}) => {
  const { page = 1, limit = 20, unreadOnly = false } = query;
  
  const filter = { recipient: userId, institution: institutionId };
  if (unreadOnly === 'true' || unreadOnly === true) {
    filter.isRead = false;
  }

  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName name'),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, institution: institutionId, isRead: false })
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

exports.getNotificationById = async (id, userId) => {
  const notification = await Notification.findOne({ _id: id, recipient: userId })
    .populate('createdBy', 'firstName lastName name');
  return notification;
};

exports.createNotification = async (data, institutionId) => {
  const notification = await Notification.create({
    ...data,
    institution: institutionId
  });
  return notification;
};

exports.createBulkNotifications = async (notifications, institutionId) => {
  const notificationsWithInstitution = notifications.map(n => ({
    ...n,
    institution: institutionId
  }));
  return Notification.insertMany(notificationsWithInstitution);
};

exports.sendToRole = async (data, role, institutionId) => {
  const users = await User.find({ institution: institutionId, role, isActive: true }).select('_id');
  const notifications = users.map(u => ({
    ...data,
    recipient: u._id,
    institution: institutionId
  }));
  return Notification.insertMany(notifications);
};

exports.sendToRoles = async (data, roles, institutionId, deliveryMethod = 'inapp') => {
  if (!roles || roles.length === 0) return { notificationCount: 0, emailsSent: 0 };
  
  const users = await User.find({ institution: institutionId, role: { $in: roles }, isActive: true })
    .select('_id email profile.firstName profile.lastName')
    .lean();
  
  if (users.length === 0) return { notificationCount: 0, emailsSent: 0 };

  let notificationCount = 0;
  let emailsSent = 0;

  // Send in-app notifications
  if (deliveryMethod === 'inapp' || deliveryMethod === 'both') {
    const notifications = users.map(u => ({
      ...data,
      recipient: u._id,
      institution: institutionId
    }));
    const result = await Notification.insertMany(notifications);
    notificationCount = result.length;
  }

  // Send emails
  if (deliveryMethod === 'email' || deliveryMethod === 'both') {
    const emailPromises = users.map(user => {
      const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
      return emailService.sendGeneric({
        to: user.email,
        subject: data.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">📅 Event Alert</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #374151;">Hello ${userName},</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h2 style="color: #1f2937; margin-top: 0;">${data.title}</h2>
                <p style="color: #6b7280;">${data.message}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This is an automated notification from your school management system.</p>
            </div>
          </div>
        `
      }).catch(err => {
        console.error(`Failed to send email to ${user.email}:`, err.message);
        return null;
      });
    });

    const results = await Promise.all(emailPromises);
    emailsSent = results.filter(Boolean).length;
  }

  return { notificationCount, emailsSent };
};

exports.sendToClass = async (data, classId, institutionId) => {
  const students = await User.find({ 
    institution: institutionId, 
    role: 'student', 
    'studentData.class': classId,
    isActive: true 
  }).select('_id');
  
  const notifications = students.map(s => ({
    ...data,
    recipient: s._id,
    institution: institutionId
  }));
  return Notification.insertMany(notifications);
};

exports.markAsRead = async (id, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  return notification;
};

exports.markAllAsRead = async (userId, institutionId) => {
  const result = await Notification.updateMany(
    { recipient: userId, institution: institutionId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return result;
};

exports.deleteNotification = async (id, userId) => {
  const result = await Notification.findOneAndDelete({ _id: id, recipient: userId });
  return result;
};

exports.deleteAllRead = async (userId, institutionId) => {
  const result = await Notification.deleteMany({ 
    recipient: userId, 
    institution: institutionId, 
    isRead: true 
  });
  return result;
};

exports.getUnreadCount = async (userId, institutionId) => {
  const count = await Notification.countDocuments({ 
    recipient: userId, 
    institution: institutionId, 
    isRead: false 
  });
  return count;
};
