const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferences.controller');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, preferencesController.getPreferences);
router.get('/widgets/available', protect, preferencesController.getAvailableWidgets);
router.put('/widgets', protect, preferencesController.updateWidgets);
router.post('/widgets', protect, preferencesController.addWidget);
router.delete('/widgets/:widgetId', protect, preferencesController.removeWidget);
router.put('/widgets/reorder', protect, preferencesController.reorderWidgets);
router.put('/widgets/:widgetId/settings', protect, preferencesController.updateWidgetSettings);
router.post('/reset', protect, preferencesController.resetToDefault);

module.exports = router;
