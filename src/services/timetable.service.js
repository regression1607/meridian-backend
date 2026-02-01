const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const ApiError = require('../utils/apiError');

class TimetableService {
  async getTimetables(institutionId, options = {}) {
    const { classId, sectionId, academicYear, isActive = true } = options;

    const query = { institution: institutionId };
    if (classId) query.class = classId;
    if (sectionId) query.section = sectionId;
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive;

    const timetables = await Timetable.find(query)
      .populate('class', 'name grade')
      .populate('section', 'name')
      .populate('schedule.periods.subject', 'name code')
      .populate('schedule.periods.teacher', 'profile.firstName profile.lastName')
      .sort({ 'class.grade': 1 })
      .lean();

    return timetables;
  }

  async getTimetableById(id, institutionId) {
    const timetable = await Timetable.findOne({ _id: id, institution: institutionId })
      .populate('class', 'name grade')
      .populate('section', 'name')
      .populate('schedule.periods.subject', 'name code')
      .populate('schedule.periods.teacher', 'profile.firstName profile.lastName');

    if (!timetable) {
      throw ApiError.notFound('Timetable not found');
    }
    return timetable;
  }

  async getTimetableByClass(classId, sectionId, institutionId) {
    const query = { 
      institution: institutionId, 
      class: classId,
      isActive: true 
    };
    
    // If sectionId provided, filter by it
    if (sectionId) {
      query.section = sectionId;
    }

    let timetable = await Timetable.findOne(query)
      .populate('class', 'name grade')
      .populate('section', 'name')
      .populate('schedule.periods.subject', 'name code')
      .populate('schedule.periods.teacher', 'profile.firstName profile.lastName');

    return timetable;
  }

  async createTimetable(data, institutionId, userId) {
    // Check if class exists
    const classDoc = await Class.findOne({ _id: data.class, institution: institutionId });
    if (!classDoc) {
      throw ApiError.notFound('Class not found');
    }

    // Check for existing active timetable with same class and section
    const existingQuery = {
      institution: institutionId,
      class: data.class,
      academicYear: data.academicYear,
      isActive: true
    };
    
    if (data.section) {
      existingQuery.section = data.section;
    }
    
    const existing = await Timetable.findOne(existingQuery);

    if (existing) {
      throw ApiError.conflict('Active timetable already exists for this class/section');
    }

    const timetable = await Timetable.create({
      ...data,
      institution: institutionId,
      createdBy: userId
    });

    return timetable;
  }

  async updateTimetable(id, data, institutionId) {
    const timetable = await Timetable.findOne({ _id: id, institution: institutionId });
    if (!timetable) {
      throw ApiError.notFound('Timetable not found');
    }

    const allowedFields = ['schedule', 'periodsPerDay', 'periodDuration', 'dayStartTime', 'effectiveFrom', 'effectiveTo', 'isActive'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        timetable[field] = data[field];
      }
    });

    await timetable.save();
    return timetable;
  }

  async deleteTimetable(id, institutionId) {
    const timetable = await Timetable.findOne({ _id: id, institution: institutionId });
    if (!timetable) {
      throw ApiError.notFound('Timetable not found');
    }

    await timetable.deleteOne();
    return { message: 'Timetable deleted successfully' };
  }

  async getTeacherTimetable(teacherId, institutionId) {
    const timetables = await Timetable.find({
      institution: institutionId,
      'schedule.periods.teacher': teacherId,
      isActive: true
    })
      .populate('class', 'name grade')
      .populate('section', 'name')
      .populate('schedule.periods.subject', 'name code')
      .lean();

    // Extract only periods for this teacher
    const schedule = [];
    timetables.forEach(tt => {
      tt.schedule.forEach(day => {
        const teacherPeriods = day.periods.filter(p => 
          p.teacher && p.teacher.toString() === teacherId.toString()
        );
        if (teacherPeriods.length > 0) {
          schedule.push({
            day: day.day,
            class: tt.class,
            section: tt.section,
            periods: teacherPeriods
          });
        }
      });
    });

    return schedule;
  }

  generateDefaultSchedule(periodsPerDay, dayStartTime, periodDuration) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const schedule = [];

    days.forEach(day => {
      const periods = [];
      let [hours, minutes] = dayStartTime.split(':').map(Number);

      for (let i = 1; i <= periodsPerDay; i++) {
        const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        minutes += periodDuration;
        if (minutes >= 60) {
          hours += Math.floor(minutes / 60);
          minutes = minutes % 60;
        }

        const endTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Add break after 4th period (lunch)
        if (i === 4) {
          periods.push({
            periodNumber: i,
            startTime,
            endTime,
            isBreak: true,
            breakType: 'lunch'
          });
          // Add lunch time
          minutes += 30;
          if (minutes >= 60) {
            hours += Math.floor(minutes / 60);
            minutes = minutes % 60;
          }
        } else {
          periods.push({
            periodNumber: i,
            startTime,
            endTime,
            isBreak: false
          });
        }

        // 5 min break between periods
        minutes += 5;
        if (minutes >= 60) {
          hours += Math.floor(minutes / 60);
          minutes = minutes % 60;
        }
      }

      schedule.push({ day, periods });
    });

    return schedule;
  }
}

module.exports = new TimetableService();
