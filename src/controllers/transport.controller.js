const transportService = require('../services/transport.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const getInstitutionId = (req) => {
  return req.user?.institution || req.query.institutionId || req.body.institutionId;
};

const transportController = {
  // ============ VEHICLE CONTROLLERS ============
  createVehicle: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const vehicle = await transportService.createVehicle(institutionId, req.body);
    res.status(201).json(ApiResponse.success('Vehicle created successfully', vehicle));
  }),

  getVehicles: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await transportService.getVehicles(institutionId, req.query);
    res.json(ApiResponse.paginated('Vehicles fetched successfully', result.vehicles, result.pagination));
  }),

  getVehicleById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const vehicle = await transportService.getVehicleById(req.params.id, institutionId);
    res.json(ApiResponse.success('Vehicle fetched successfully', vehicle));
  }),

  updateVehicle: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const vehicle = await transportService.updateVehicle(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Vehicle updated successfully', vehicle));
  }),

  deleteVehicle: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await transportService.deleteVehicle(req.params.id, institutionId);
    res.json(ApiResponse.success('Vehicle deleted successfully', null));
  }),

  // ============ ROUTE CONTROLLERS ============
  createRoute: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const route = await transportService.createRoute(institutionId, req.body);
    res.status(201).json(ApiResponse.success('Route created successfully', route));
  }),

  getRoutes: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await transportService.getRoutes(institutionId, req.query);
    res.json(ApiResponse.paginated('Routes fetched successfully', result.routes, result.pagination));
  }),

  getRouteById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const route = await transportService.getRouteById(req.params.id, institutionId);
    res.json(ApiResponse.success('Route fetched successfully', route));
  }),

  updateRoute: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const route = await transportService.updateRoute(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Route updated successfully', route));
  }),

  deleteRoute: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await transportService.deleteRoute(req.params.id, institutionId);
    res.json(ApiResponse.success('Route deleted successfully', null));
  }),

  // ============ ALLOCATION CONTROLLERS ============
  allocateTransport: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const allocation = await transportService.allocateTransport(institutionId, req.body);
    res.status(201).json(ApiResponse.success('Transport allocated successfully', allocation));
  }),

  getAllocations: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await transportService.getAllocations(institutionId, req.query);
    res.json(ApiResponse.paginated('Allocations fetched successfully', result.allocations, result.pagination));
  }),

  updateAllocation: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const allocation = await transportService.updateAllocation(req.params.id, institutionId, req.body);
    res.json(ApiResponse.success('Allocation updated successfully', allocation));
  }),

  deleteAllocation: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await transportService.deleteAllocation(req.params.id, institutionId);
    res.json(ApiResponse.success('Allocation removed successfully', null));
  }),

  // ============ STATS ============
  getStats: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const stats = await transportService.getTransportStats(institutionId);
    res.json(ApiResponse.success('Transport stats fetched successfully', stats));
  })
};

module.exports = transportController;
