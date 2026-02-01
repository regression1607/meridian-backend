const UserPreferences = require('../models/UserPreferences');
const ApiError = require('../utils/apiError');

const DEFAULT_WIDGETS = [
  { id: 'stats-overview', type: 'stats', title: 'Quick Stats', size: 'full', position: 0, visible: true },
  { id: 'attendance-today', type: 'attendance', title: "Today's Attendance", size: 'medium', position: 1, visible: true },
  { id: 'fee-collection', type: 'fees', title: 'Fee Collection', size: 'medium', position: 2, visible: true },
  { id: 'upcoming-events', type: 'events', title: 'Upcoming Events', size: 'medium', position: 3, visible: true },
  { id: 'recent-activities', type: 'activities', title: 'Recent Activities', size: 'medium', position: 4, visible: true },
  { id: 'calendar-widget', type: 'calendar', title: 'Calendar', size: 'medium', position: 5, visible: true },
  { id: 'announcements', type: 'announcements', title: 'Announcements', size: 'large', position: 6, visible: true }
];

const AVAILABLE_WIDGETS = [
  { id: 'stats-overview', type: 'stats', title: 'Quick Stats', description: 'Overview of key metrics', icon: 'BarChart3' },
  { id: 'attendance-today', type: 'attendance', title: "Today's Attendance", description: 'Current attendance status', icon: 'Users' },
  { id: 'fee-collection', type: 'fees', title: 'Fee Collection', description: 'Fee collection summary', icon: 'DollarSign' },
  { id: 'upcoming-events', type: 'events', title: 'Upcoming Events', description: 'Next scheduled events', icon: 'Calendar' },
  { id: 'recent-activities', type: 'activities', title: 'Recent Activities', description: 'Latest system activities', icon: 'Activity' },
  { id: 'calendar-widget', type: 'calendar', title: 'Calendar', description: 'Monthly calendar view', icon: 'CalendarDays' },
  { id: 'announcements', type: 'announcements', title: 'Announcements', description: 'Important announcements', icon: 'Bell' },
  { id: 'student-birthdays', type: 'birthdays', title: 'Birthdays Today', description: 'Student birthdays', icon: 'Cake' },
  { id: 'library-stats', type: 'library', title: 'Library Stats', description: 'Library overview', icon: 'BookOpen' },
  { id: 'transport-status', type: 'transport', title: 'Transport Status', description: 'Vehicle status', icon: 'Bus' },
  { id: 'homework-pending', type: 'homework', title: 'Pending Homework', description: 'Homework submissions', icon: 'FileText' },
  { id: 'exam-schedule', type: 'exams', title: 'Exam Schedule', description: 'Upcoming exams', icon: 'ClipboardList' },
  { id: 'payroll-summary', type: 'payroll', title: 'Payroll Summary', description: 'Staff payroll status', icon: 'Wallet' },
  { id: 'hostel-occupancy', type: 'hostel', title: 'Hostel Occupancy', description: 'Room occupancy status', icon: 'Building' },
  { id: 'admission-stats', type: 'admissions', title: 'Admission Stats', description: 'New admissions', icon: 'UserPlus' },
  { id: 'performance-chart', type: 'performance', title: 'Performance Chart', description: 'Academic performance', icon: 'TrendingUp' }
];

class PreferencesService {
  async getPreferences(userId, institutionId) {
    let preferences = await UserPreferences.findOne({ user: userId });
    
    if (!preferences) {
      preferences = await this.createDefaultPreferences(userId, institutionId);
    }
    
    return preferences;
  }

  async createDefaultPreferences(userId, institutionId) {
    const preferences = new UserPreferences({
      user: userId,
      institutionId,
      dashboard: {
        widgets: DEFAULT_WIDGETS,
        layout: 'grid',
        theme: 'light'
      }
    });
    await preferences.save();
    return preferences;
  }

  async updateDashboardWidgets(userId, widgets) {
    const preferences = await UserPreferences.findOneAndUpdate(
      { user: userId },
      { $set: { 'dashboard.widgets': widgets } },
      { new: true, upsert: true }
    );
    return preferences;
  }

  async addWidget(userId, widgetData) {
    const preferences = await UserPreferences.findOne({ user: userId });
    if (!preferences) throw new ApiError(404, 'Preferences not found');

    const existingWidget = preferences.dashboard.widgets.find(w => w.id === widgetData.id);
    if (existingWidget) {
      existingWidget.visible = true;
      existingWidget.position = widgetData.position || preferences.dashboard.widgets.length;
    } else {
      preferences.dashboard.widgets.push({
        ...widgetData,
        position: widgetData.position || preferences.dashboard.widgets.length,
        visible: true
      });
    }

    await preferences.save();
    return preferences;
  }

  async removeWidget(userId, widgetId) {
    const preferences = await UserPreferences.findOne({ user: userId });
    if (!preferences) throw new ApiError(404, 'Preferences not found');

    const widget = preferences.dashboard.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.visible = false;
    }

    await preferences.save();
    return preferences;
  }

  async reorderWidgets(userId, widgetOrder) {
    const preferences = await UserPreferences.findOne({ user: userId });
    if (!preferences) throw new ApiError(404, 'Preferences not found');

    widgetOrder.forEach((widgetId, index) => {
      const widget = preferences.dashboard.widgets.find(w => w.id === widgetId);
      if (widget) {
        widget.position = index;
      }
    });

    preferences.dashboard.widgets.sort((a, b) => a.position - b.position);
    await preferences.save();
    return preferences;
  }

  async updateWidgetSettings(userId, widgetId, settings) {
    const preferences = await UserPreferences.findOne({ user: userId });
    if (!preferences) throw new ApiError(404, 'Preferences not found');

    const widget = preferences.dashboard.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.settings = { ...widget.settings, ...settings };
      widget.size = settings.size || widget.size;
    }

    await preferences.save();
    return preferences;
  }

  async resetToDefault(userId, institutionId) {
    const preferences = await UserPreferences.findOneAndUpdate(
      { user: userId },
      { 
        $set: { 
          'dashboard.widgets': DEFAULT_WIDGETS,
          'dashboard.layout': 'grid'
        } 
      },
      { new: true, upsert: true }
    );
    return preferences;
  }

  getAvailableWidgets() {
    return AVAILABLE_WIDGETS;
  }
}

module.exports = new PreferencesService();
