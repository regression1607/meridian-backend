const eventService = require('../services/event.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const getInstitutionId = (req) => {
  return req.user?.institution || req.query.institutionId || req.body.institutionId;
};

const eventController = {
  createEvent: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const event = await eventService.createEvent(institutionId, req.body, req.user._id);
    res.status(201).json(ApiResponse.success('Event created successfully', event));
  }),

  getEvents: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const result = await eventService.getEvents(institutionId, req.query);
    res.json(ApiResponse.paginated('Events fetched successfully', result.events, result.pagination));
  }),

  getEventById: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const event = await eventService.getEventById(req.params.id, institutionId);
    res.json(ApiResponse.success('Event fetched successfully', event));
  }),

  updateEvent: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const event = await eventService.updateEvent(req.params.id, institutionId, req.body, req.user._id);
    res.json(ApiResponse.success('Event updated successfully', event));
  }),

  deleteEvent: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    await eventService.deleteEvent(req.params.id, institutionId);
    res.json(ApiResponse.success('Event deleted successfully', null));
  }),

  registerForEvent: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const event = await eventService.registerForEvent(req.params.id, institutionId, req.user._id);
    res.json(ApiResponse.success('Registered successfully', event));
  }),

  cancelRegistration: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const event = await eventService.cancelRegistration(req.params.id, institutionId, req.user._id);
    res.json(ApiResponse.success('Registration cancelled', event));
  }),

  getUpcomingEvents: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const events = await eventService.getUpcomingEvents(institutionId, req.query.limit);
    res.json(ApiResponse.success('Upcoming events fetched', events));
  }),

  getEventsByMonth: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const { year, month } = req.query;
    const events = await eventService.getEventsByMonth(institutionId, parseInt(year), parseInt(month));
    res.json(ApiResponse.success('Events fetched', events));
  }),

  getEventStats: asyncHandler(async (req, res) => {
    const institutionId = getInstitutionId(req);
    const stats = await eventService.getEventStats(institutionId);
    res.json(ApiResponse.success('Event stats fetched', stats));
  })
};

module.exports = eventController;
