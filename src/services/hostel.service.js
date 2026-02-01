const { HostelBlock, Room, RoomAllocation, MessMenu, VisitorLog, HostelComplaint } = require('../models/Hostel');
const ApiError = require('../utils/apiError');

class HostelService {
  // ============ BLOCK METHODS ============
  async createBlock(institutionId, blockData, userId) {
    const existing = await HostelBlock.findOne({
      institution: institutionId,
      code: blockData.code,
      isDeleted: false
    });

    if (existing) {
      throw new ApiError(400, 'Block with this code already exists');
    }

    const block = new HostelBlock({
      ...blockData,
      institution: institutionId
    });

    await block.save();
    return block;
  }

  async getBlocks(institutionId, filters = {}) {
    const { type, status, search, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [blocks, total] = await Promise.all([
      HostelBlock.find(query)
        .populate('warden', 'profile.firstName profile.lastName email')
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      HostelBlock.countDocuments(query)
    ]);

    return {
      blocks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getBlockById(blockId, institutionId) {
    const block = await HostelBlock.findOne({
      _id: blockId,
      institution: institutionId,
      isDeleted: false
    }).populate('warden', 'profile.firstName profile.lastName email phone');

    if (!block) {
      throw new ApiError(404, 'Block not found');
    }

    return block;
  }

  async updateBlock(blockId, institutionId, updateData) {
    const block = await HostelBlock.findOneAndUpdate(
      { _id: blockId, institution: institutionId, isDeleted: false },
      updateData,
      { new: true }
    );

    if (!block) {
      throw new ApiError(404, 'Block not found');
    }

    return block;
  }

  async deleteBlock(blockId, institutionId) {
    const roomCount = await Room.countDocuments({
      block: blockId,
      isDeleted: false
    });

    if (roomCount > 0) {
      throw new ApiError(400, 'Cannot delete block with existing rooms');
    }

    const block = await HostelBlock.findOneAndUpdate(
      { _id: blockId, institution: institutionId },
      { isDeleted: true },
      { new: true }
    );

    if (!block) {
      throw new ApiError(404, 'Block not found');
    }

    return block;
  }

  // ============ ROOM METHODS ============
  async createRoom(institutionId, roomData, userId) {
    const existing = await Room.findOne({
      institution: institutionId,
      block: roomData.block,
      roomNumber: roomData.roomNumber,
      isDeleted: false
    });

    if (existing) {
      throw new ApiError(400, 'Room with this number already exists in this block');
    }

    const room = new Room({
      ...roomData,
      institution: institutionId
    });

    await room.save();
    return room;
  }

  async getRooms(institutionId, filters = {}) {
    const { blockId, status, roomType, search, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (blockId) query.block = blockId;
    if (status) query.status = status;
    if (roomType) query.roomType = roomType;
    if (search) {
      query.roomNumber = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      Room.find(query)
        .populate('block', 'name code type')
        .sort({ roomNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Room.countDocuments(query)
    ]);

    return {
      rooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getRoomById(roomId, institutionId) {
    const room = await Room.findOne({
      _id: roomId,
      institution: institutionId,
      isDeleted: false
    }).populate('block', 'name code type warden');

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    return room;
  }

  async updateRoom(roomId, institutionId, updateData) {
    const room = await Room.findOneAndUpdate(
      { _id: roomId, institution: institutionId, isDeleted: false },
      updateData,
      { new: true }
    );

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    return room;
  }

  async deleteRoom(roomId, institutionId) {
    const activeAllocations = await RoomAllocation.countDocuments({
      room: roomId,
      status: 'active',
      isDeleted: false
    });

    if (activeAllocations > 0) {
      throw new ApiError(400, 'Cannot delete room with active allocations');
    }

    const room = await Room.findOneAndUpdate(
      { _id: roomId, institution: institutionId },
      { isDeleted: true },
      { new: true }
    );

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    return room;
  }

  // ============ ALLOCATION METHODS ============
  async allocateRoom(institutionId, allocationData, userId) {
    const { roomId, studentId, bedNumber } = allocationData;

    const room = await Room.findOne({
      _id: roomId,
      institution: institutionId,
      isDeleted: false
    });

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    if (room.occupiedBeds >= room.capacity) {
      throw new ApiError(400, 'Room is full');
    }

    const existingBed = await RoomAllocation.findOne({
      room: roomId,
      bedNumber,
      status: 'active',
      isDeleted: false
    });

    if (existingBed) {
      throw new ApiError(400, 'Bed is already occupied');
    }

    const existingStudentAllocation = await RoomAllocation.findOne({
      institution: institutionId,
      student: studentId,
      status: 'active',
      isDeleted: false
    });

    if (existingStudentAllocation) {
      throw new ApiError(400, 'Student already has an active room allocation');
    }

    const allocation = new RoomAllocation({
      ...allocationData,
      room: roomId,
      student: studentId,
      institution: institutionId,
      allocatedBy: userId,
      monthlyRent: allocationData.monthlyRent || room.monthlyRent
    });

    await allocation.save();

    room.occupiedBeds += 1;
    if (room.occupiedBeds >= room.capacity) {
      room.status = 'full';
    }
    await room.save();

    return allocation.populate(['room', 'student']);
  }

  async getAllocations(institutionId, filters = {}) {
    const { roomId, blockId, status, studentId, academicYear, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (roomId) query.room = roomId;
    if (status) query.status = status;
    if (studentId) query.student = studentId;
    if (academicYear) query.academicYear = academicYear;

    if (blockId) {
      const rooms = await Room.find({ block: blockId, isDeleted: false }).select('_id');
      query.room = { $in: rooms.map(r => r._id) };
    }

    const skip = (page - 1) * limit;

    const [allocations, total] = await Promise.all([
      RoomAllocation.find(query)
        .populate({
          path: 'room',
          populate: { path: 'block', select: 'name code type' }
        })
        .populate('student', 'profile.firstName profile.lastName email studentId')
        .populate('allocatedBy', 'profile.firstName profile.lastName')
        .sort({ allocationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      RoomAllocation.countDocuments(query)
    ]);

    return {
      allocations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async vacateRoom(allocationId, institutionId, userId, remarks) {
    const allocation = await RoomAllocation.findOne({
      _id: allocationId,
      institution: institutionId,
      status: 'active',
      isDeleted: false
    });

    if (!allocation) {
      throw new ApiError(404, 'Allocation not found or already vacated');
    }

    allocation.status = 'vacated';
    allocation.vacatingDate = new Date();
    allocation.remarks = remarks;
    await allocation.save();

    const room = await Room.findById(allocation.room);
    if (room) {
      room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);
      if (room.status === 'full') {
        room.status = 'available';
      }
      await room.save();
    }

    return allocation.populate(['room', 'student']);
  }

  // ============ MESS MENU METHODS ============
  async createMessMenu(institutionId, menuData) {
    const existing = await MessMenu.findOne({
      institution: institutionId,
      block: menuData.block || null,
      dayOfWeek: menuData.dayOfWeek,
      mealType: menuData.mealType
    });

    if (existing) {
      existing.items = menuData.items;
      existing.timing = menuData.timing;
      existing.specialNote = menuData.specialNote;
      await existing.save();
      return existing;
    }

    const menu = new MessMenu({
      ...menuData,
      institution: institutionId
    });

    await menu.save();
    return menu;
  }

  async getMessMenu(institutionId, filters = {}) {
    const { blockId, dayOfWeek } = filters;
    
    const query = { institution: institutionId, isActive: true };
    if (blockId) query.block = blockId;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;

    const menus = await MessMenu.find(query)
      .populate('block', 'name code')
      .sort({ dayOfWeek: 1, mealType: 1 })
      .lean();

    return menus;
  }

  async updateMessMenu(menuId, institutionId, updateData) {
    const menu = await MessMenu.findOneAndUpdate(
      { _id: menuId, institution: institutionId },
      updateData,
      { new: true }
    );

    if (!menu) {
      throw new ApiError(404, 'Menu not found');
    }

    return menu;
  }

  async deleteMessMenu(menuId, institutionId) {
    const menu = await MessMenu.findOneAndDelete({
      _id: menuId,
      institution: institutionId
    });

    if (!menu) {
      throw new ApiError(404, 'Menu not found');
    }

    return menu;
  }

  // ============ VISITOR LOG METHODS ============
  async createVisitorLog(institutionId, visitorData, userId) {
    const log = new VisitorLog({
      ...visitorData,
      institution: institutionId,
      approvedBy: userId
    });

    await log.save();
    return log.populate(['student', 'block', 'approvedBy']);
  }

  async getVisitorLogs(institutionId, filters = {}) {
    const { blockId, studentId, status, date, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId };
    if (blockId) query.block = blockId;
    if (studentId) query.student = studentId;
    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.checkInTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      VisitorLog.find(query)
        .populate('block', 'name code')
        .populate('student', 'profile.firstName profile.lastName email')
        .populate('approvedBy', 'profile.firstName profile.lastName')
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VisitorLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async checkOutVisitor(logId, institutionId) {
    const log = await VisitorLog.findOneAndUpdate(
      { _id: logId, institution: institutionId, status: 'checked_in' },
      { checkOutTime: new Date(), status: 'checked_out' },
      { new: true }
    );

    if (!log) {
      throw new ApiError(404, 'Visitor log not found or already checked out');
    }

    return log;
  }

  // ============ COMPLAINT METHODS ============
  async createComplaint(institutionId, complaintData, userId) {
    const complaint = new HostelComplaint({
      ...complaintData,
      institution: institutionId,
      complainant: userId
    });

    await complaint.save();
    return complaint;
  }

  async getComplaints(institutionId, filters = {}) {
    const { blockId, category, status, priority, studentId, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (blockId) query.block = blockId;
    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (studentId) query.complainant = studentId;

    const skip = (page - 1) * limit;

    const [complaints, total] = await Promise.all([
      HostelComplaint.find(query)
        .populate('block', 'name code')
        .populate('room', 'roomNumber')
        .populate('complainant', 'profile.firstName profile.lastName email')
        .populate('assignedTo', 'profile.firstName profile.lastName')
        .populate('resolvedBy', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      HostelComplaint.countDocuments(query)
    ]);

    return {
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateComplaint(complaintId, institutionId, updateData, userId) {
    const complaint = await HostelComplaint.findOne({
      _id: complaintId,
      institution: institutionId,
      isDeleted: false
    });

    if (!complaint) {
      throw new ApiError(404, 'Complaint not found');
    }

    Object.assign(complaint, updateData);

    if (updateData.status === 'resolved' && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
      complaint.resolvedBy = userId;
    }

    await complaint.save();
    return complaint;
  }

  async deleteComplaint(complaintId, institutionId) {
    const complaint = await HostelComplaint.findOneAndUpdate(
      { _id: complaintId, institution: institutionId },
      { isDeleted: true },
      { new: true }
    );

    if (!complaint) {
      throw new ApiError(404, 'Complaint not found');
    }

    return complaint;
  }

  // ============ STATS ============
  async getHostelStats(institutionId) {
    const mongoose = require('mongoose');
    let instId;
    try {
      instId = new mongoose.Types.ObjectId(institutionId);
    } catch (e) {
      instId = institutionId;
    }

    const [
      totalBlocks,
      totalRooms,
      roomStats,
      totalAllocations,
      activeAllocations,
      openComplaints,
      todayVisitors
    ] = await Promise.all([
      HostelBlock.countDocuments({ institution: institutionId, isDeleted: false }),
      Room.countDocuments({ institution: institutionId, isDeleted: false }),
      Room.aggregate([
        { $match: { institution: instId, isDeleted: false } },
        { $group: { _id: null, totalCapacity: { $sum: '$capacity' }, occupiedBeds: { $sum: '$occupiedBeds' } } }
      ]),
      RoomAllocation.countDocuments({ institution: institutionId, isDeleted: false }),
      RoomAllocation.countDocuments({ institution: institutionId, status: 'active', isDeleted: false }),
      HostelComplaint.countDocuments({ institution: institutionId, status: { $in: ['open', 'in_progress'] }, isDeleted: false }),
      VisitorLog.countDocuments({
        institution: institutionId,
        checkInTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: 'checked_in'
      })
    ]);

    return {
      totalBlocks,
      totalRooms,
      totalCapacity: roomStats[0]?.totalCapacity || 0,
      occupiedBeds: roomStats[0]?.occupiedBeds || 0,
      availableBeds: (roomStats[0]?.totalCapacity || 0) - (roomStats[0]?.occupiedBeds || 0),
      totalAllocations,
      activeAllocations,
      openComplaints,
      todayVisitors
    };
  }
}

module.exports = new HostelService();
