const Notification = require('../models/Notification');
const User = require('../models/User');

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
