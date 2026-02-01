const Event = require('../models/Event');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

class EventService {
  async createEvent(institutionId, data, userId) {
    const event = new Event({
      ...data,
      institutionId,
      createdBy: userId
    });
    await event.save();
    return event;
  }

  async getEvents(institutionId, query = {}) {
    const { page = 1, limit = 10, type, status, startDate, endDate, search } = query;
    const skip = (page - 1) * limit;
    
    // Convert to ObjectId same as stats function does
    const instId = new mongoose.Types.ObjectId(institutionId);
    
    const events = await Event.find({ institutionId: instId })
      .populate('organizer', 'email profile')
      .populate('createdBy', 'email profile')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Event.countDocuments({ institutionId: instId });

    return {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getEventById(id, institutionId) {
    const event = await Event.findOne({ _id: id, institutionId })
      .populate('organizer', 'email profile')
      .populate('createdBy', 'email profile')
      .populate('registeredParticipants.user', 'email profile role');
    if (!event) throw new ApiError(404, 'Event not found');
    return event;
  }

  async updateEvent(id, institutionId, data, userId) {
    const event = await Event.findOneAndUpdate(
      { _id: id, institutionId },
      { $set: { ...data, updatedBy: userId } },
      { new: true, runValidators: true }
    );
    if (!event) throw new ApiError(404, 'Event not found');
    return event;
  }

  async deleteEvent(id, institutionId) {
    const event = await Event.findOneAndDelete({ _id: id, institutionId });
    if (!event) throw new ApiError(404, 'Event not found');
    return { message: 'Event deleted successfully' };
  }

  async registerForEvent(eventId, institutionId, userId) {
    const event = await Event.findOne({ _id: eventId, institutionId });
    if (!event) throw new ApiError(404, 'Event not found');
    
    if (!event.registrationRequired) {
      throw new ApiError(400, 'Registration not required for this event');
    }
    
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new ApiError(400, 'Registration deadline has passed');
    }
    
    if (event.maxParticipants && event.registeredParticipants.length >= event.maxParticipants) {
      throw new ApiError(400, 'Event is full');
    }
    
    const alreadyRegistered = event.registeredParticipants.some(
      p => p.user.toString() === userId.toString()
    );
    if (alreadyRegistered) {
      throw new ApiError(400, 'Already registered for this event');
    }

    event.registeredParticipants.push({ user: userId });
    await event.save();
    return event;
  }

  async cancelRegistration(eventId, institutionId, userId) {
    const event = await Event.findOneAndUpdate(
      { _id: eventId, institutionId },
      { $pull: { registeredParticipants: { user: userId } } },
      { new: true }
    );
    if (!event) throw new ApiError(404, 'Event not found');
    return event;
  }

  async getUpcomingEvents(institutionId, limit = 5) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    return Event.find({
      institutionId: instId,
      startDate: { $gte: new Date() },
      status: 'published'
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .populate('organizer', 'email profile');
  }

  async getEventsByMonth(institutionId, year, month) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    return Event.find({
      institutionId: instId,
      status: { $in: ['published', 'completed'] },
      $or: [
        { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { endDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { startDate: { $lte: startOfMonth }, endDate: { $gte: endOfMonth } }
      ]
    }).sort({ startDate: 1 });
  }

  async getEventStats(institutionId) {
    const instId = new mongoose.Types.ObjectId(institutionId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [total, upcoming, thisMonth, byType] = await Promise.all([
      Event.countDocuments({ institutionId: instId, status: { $ne: 'cancelled' } }),
      Event.countDocuments({ institutionId: instId, startDate: { $gte: now }, status: 'published' }),
      Event.countDocuments({ 
        institutionId: instId, 
        startDate: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $ne: 'cancelled' }
      }),
      Event.aggregate([
        { $match: { institutionId: instId, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total,
      upcoming,
      thisMonth,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}

module.exports = new EventService();
