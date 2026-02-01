const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(
    req.user._id,
    req.user.institution,
    req.query
  );
  res.json({
    success: true,
    data: result.notifications,
    unreadCount: result.unreadCount,
    pagination: result.pagination
  });
});

exports.getNotificationById = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationById(req.params.id, req.user._id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.json({ success: true, data: notification });
});

exports.createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(req.body, req.user.institution);
  res.status(201).json({ success: true, data: notification });
});

exports.sendToRole = asyncHandler(async (req, res) => {
  const { role, ...data } = req.body;
  data.createdBy = req.user._id;
  const result = await notificationService.sendToRole(data, role, req.user.institution);
  res.status(201).json({ success: true, count: result.length });
});

exports.sendToClass = asyncHandler(async (req, res) => {
  const { classId, ...data } = req.body;
  data.createdBy = req.user._id;
  const result = await notificationService.sendToClass(data, classId, req.user.institution);
  res.status(201).json({ success: true, count: result.length });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.json({ success: true, data: notification });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id, req.user.institution);
  res.json({ success: true, modifiedCount: result.modifiedCount });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.id, req.user._id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.json({ success: true, message: 'Notification deleted' });
});

exports.deleteAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteAllRead(req.user._id, req.user.institution);
  res.json({ success: true, deletedCount: result.deletedCount });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id, req.user.institution);
  res.json({ success: true, count });
});
