const hostelService = require('../services/hostel.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const getInstitutionId = (req) => {
  return req.user?.institution || req.query.institutionId || req.body.institutionId;
};

const hostelController = {
  // ============ BLOCK CONTROLLERS ============
  createBlock: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const block = await hostelService.createBlock(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Block created successfully', block));
  }),

  getBlocks: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await hostelService.getBlocks(institutionId, req.query);
    res.json(ApiResponse.paginated('Blocks fetched successfully', result.blocks, result.pagination));
  }),

  getBlockById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const block = await hostelService.getBlockById(req.params.id, institutionId);
    res.json(ApiResponse.success('Block fetched successfully', block));
  }),

  updateBlock: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const block = await hostelService.updateBlock(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Block updated successfully', block));
  }),

  deleteBlock: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await hostelService.deleteBlock(req.params.id, institutionId);
    res.json(ApiResponse.success('Block deleted successfully', null));
  }),

  // ============ ROOM CONTROLLERS ============
  createRoom: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const room = await hostelService.createRoom(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Room created successfully', room));
  }),

  getRooms: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await hostelService.getRooms(institutionId, req.query);
    res.json(ApiResponse.paginated('Rooms fetched successfully', result.rooms, result.pagination));
  }),

  getRoomById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const room = await hostelService.getRoomById(req.params.id, institutionId);
    res.json(ApiResponse.success('Room fetched successfully', room));
  }),

  updateRoom: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const room = await hostelService.updateRoom(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Room updated successfully', room));
  }),

  deleteRoom: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await hostelService.deleteRoom(req.params.id, institutionId);
    res.json(ApiResponse.success('Room deleted successfully', null));
  }),

  // ============ ALLOCATION CONTROLLERS ============
  allocateRoom: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const allocation = await hostelService.allocateRoom(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Room allocated successfully', allocation));
  }),

  getAllocations: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await hostelService.getAllocations(institutionId, req.query);
    res.json(ApiResponse.paginated('Allocations fetched successfully', result.allocations, result.pagination));
  }),

  vacateRoom: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const { remarks } = req.body;
    const allocation = await hostelService.vacateRoom(req.params.id, institutionId, req.user._id, remarks);
    res.json(ApiResponse.success('Room vacated successfully', allocation));
  }),

  // ============ MESS MENU CONTROLLERS ============
  createMessMenu: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const menu = await hostelService.createMessMenu(institutionId, req.body);
    res.status(201).json(ApiResponse.success('Menu created successfully', menu));
  }),

  getMessMenu: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const menus = await hostelService.getMessMenu(institutionId, req.query);
    res.json(ApiResponse.success('Menu fetched successfully', menus));
  }),

  updateMessMenu: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const menu = await hostelService.updateMessMenu(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Menu updated successfully', menu));
  }),

  deleteMessMenu: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await hostelService.deleteMessMenu(req.params.id, institutionId);
    res.json(ApiResponse.success('Menu deleted successfully', null));
  }),

  // ============ VISITOR LOG CONTROLLERS ============
  createVisitorLog: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const log = await hostelService.createVisitorLog(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Visitor logged successfully', log));
  }),

  getVisitorLogs: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await hostelService.getVisitorLogs(institutionId, req.query);
    res.json(ApiResponse.paginated('Visitor logs fetched successfully', result.logs, result.pagination));
  }),

  checkOutVisitor: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const log = await hostelService.checkOutVisitor(req.params.id, institutionId);
    res.json(ApiResponse.success('Visitor checked out successfully', log));
  }),

  // ============ COMPLAINT CONTROLLERS ============
  createComplaint: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const complaint = await hostelService.createComplaint(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Complaint submitted successfully', complaint));
  }),

  getComplaints: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await hostelService.getComplaints(institutionId, req.query);
    res.json(ApiResponse.paginated('Complaints fetched successfully', result.complaints, result.pagination));
  }),

  updateComplaint: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const complaint = await hostelService.updateComplaint(req.params.id, institutionId, req.body, req.user._id);
    res.json(ApiResponse.success('Complaint updated successfully', complaint));
  }),

  deleteComplaint: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await hostelService.deleteComplaint(req.params.id, institutionId);
    res.json(ApiResponse.success('Complaint deleted successfully', null));
  }),

  // ============ STATS ============
  getStats: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const stats = await hostelService.getHostelStats(institutionId);
    res.json(ApiResponse.success('Hostel stats fetched successfully', stats));
  })
};

module.exports = hostelController;
