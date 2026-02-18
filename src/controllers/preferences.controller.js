const preferencesService = require('../services/preferences.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');

const preferencesController = {
  getPreferences: asyncHandler(async (req, res) => {
    const preferences = await preferencesService.getPreferences(req.user._id, req.user.institution, req.user.role);
    res.json(ApiResponse.success('Preferences fetched', preferences));
  }),

  updateWidgets: asyncHandler(async (req, res) => {
    const { widgets } = req.body;
    const preferences = await preferencesService.updateDashboardWidgets(req.user._id, widgets);
    res.json(ApiResponse.success('Widgets updated', preferences));
  }),

  addWidget: asyncHandler(async (req, res) => {
    const preferences = await preferencesService.addWidget(req.user._id, req.body, req.user.institution, req.user.role);
    res.json(ApiResponse.success('Widget added', preferences));
  }),

  removeWidget: asyncHandler(async (req, res) => {
    const { widgetId } = req.params;
    const preferences = await preferencesService.removeWidget(req.user._id, widgetId);
    res.json(ApiResponse.success('Widget removed', preferences));
  }),

  reorderWidgets: asyncHandler(async (req, res) => {
    const { order } = req.body;
    const preferences = await preferencesService.reorderWidgets(req.user._id, order);
    res.json(ApiResponse.success('Widgets reordered', preferences));
  }),

  updateWidgetSettings: asyncHandler(async (req, res) => {
    const { widgetId } = req.params;
    const preferences = await preferencesService.updateWidgetSettings(req.user._id, widgetId, req.body);
    res.json(ApiResponse.success('Widget settings updated', preferences));
  }),

  resetToDefault: asyncHandler(async (req, res) => {
    const preferences = await preferencesService.resetToDefault(req.user._id, req.user.institution, req.user.role);
    res.json(ApiResponse.success('Dashboard reset to default', preferences));
  }),

  getAvailableWidgets: asyncHandler(async (req, res) => {
    const widgets = preferencesService.getAvailableWidgets();
    res.json(ApiResponse.success('Available widgets', widgets));
  })
};

module.exports = preferencesController;
