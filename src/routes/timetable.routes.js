const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetable.controller');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router.route('/')
  .get(timetableController.getTimetables)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), timetableController.createTimetable);

router.post('/generate-schedule', timetableController.generateDefaultSchedule);

router.get('/teacher/:teacherId?', timetableController.getTeacherTimetable);

router.get('/class/:classId', timetableController.getTimetableByClass);

router.route('/:id')
  .get(timetableController.getTimetableById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COORDINATOR), timetableController.updateTimetable)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN), timetableController.deleteTimetable);

module.exports = router;
