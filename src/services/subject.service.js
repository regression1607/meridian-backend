const Subject = require('../models/Subject');
const Class = require('../models/Class');
const ApiError = require('../utils/apiError');

class SubjectService {
  async getSubjects(institutionId, options = {}) {
    const { page = 1, limit = 50, type, classId, isActive = true } = options;
    const skip = (page - 1) * limit;

    const query = { institution: institutionId };
    if (type) query.type = type;
    if (classId) query.classes = classId;
    if (isActive !== undefined) query.isActive = isActive;

    const [subjects, total] = await Promise.all([
      Subject.find(query)
        .populate('classes', 'name grade')
        .populate('teachers', 'profile.firstName profile.lastName')
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Subject.countDocuments(query)
    ]);

    return {
      data: subjects,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getSubjectById(id, institutionId) {
    const subject = await Subject.findOne({ _id: id, institution: institutionId })
      .populate('classes', 'name grade sections')
      .populate('teachers', 'profile.firstName profile.lastName email');

    if (!subject) {
      throw ApiError.notFound('Subject not found');
    }
    return subject;
  }

  async createSubject(data, institutionId) {
    // Check for duplicate code
    if (data.code) {
      const existing = await Subject.findOne({
        institution: institutionId,
        code: data.code
      });
      if (existing) {
        throw ApiError.conflict('Subject with this code already exists');
      }
    }

    const subject = await Subject.create({
      ...data,
      institution: institutionId
    });

    // If classes are provided, update them
    if (data.classes && data.classes.length > 0) {
      await Class.updateMany(
        { _id: { $in: data.classes }, institution: institutionId },
        { $addToSet: { subjects: subject._id } }
      );
    }

    return subject;
  }

  async updateSubject(id, data, institutionId) {
    const subject = await Subject.findOne({ _id: id, institution: institutionId });
    if (!subject) {
      throw ApiError.notFound('Subject not found');
    }

    const allowedFields = ['name', 'code', 'description', 'type', 'credits', 'isActive'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        subject[field] = data[field];
      }
    });

    // Handle classes assignment
    if (data.classes !== undefined) {
      const oldClasses = subject.classes || [];
      subject.classes = data.classes;
      
      // Update classes to include this subject
      if (data.classes.length > 0) {
        await Class.updateMany(
          { _id: { $in: data.classes }, institution: institutionId },
          { $addToSet: { subjects: subject._id } }
        );
      }
      
      // Remove from classes not in the new list
      const removedClasses = oldClasses.filter(c => !data.classes.includes(c.toString()));
      if (removedClasses.length > 0) {
        await Class.updateMany(
          { _id: { $in: removedClasses } },
          { $pull: { subjects: subject._id } }
        );
      }
    }

    // Handle teachers assignment
    if (data.teachers !== undefined) {
      subject.teachers = data.teachers;
    }

    await subject.save();
    return subject;
  }

  async deleteSubject(id, institutionId) {
    const subject = await Subject.findOne({ _id: id, institution: institutionId });
    if (!subject) {
      throw ApiError.notFound('Subject not found');
    }

    // Remove subject from all classes
    await Class.updateMany(
      { subjects: id },
      { $pull: { subjects: id } }
    );

    await subject.deleteOne();
    return { message: 'Subject deleted successfully' };
  }

  async assignToClasses(subjectId, classIds, institutionId) {
    const subject = await Subject.findOne({ _id: subjectId, institution: institutionId });
    if (!subject) {
      throw ApiError.notFound('Subject not found');
    }

    // Update subject with new classes
    subject.classes = classIds;
    await subject.save();

    // Update classes to include this subject
    await Class.updateMany(
      { _id: { $in: classIds }, institution: institutionId },
      { $addToSet: { subjects: subjectId } }
    );

    // Remove from classes not in the list
    await Class.updateMany(
      { _id: { $nin: classIds }, subjects: subjectId },
      { $pull: { subjects: subjectId } }
    );

    return subject;
  }

  async assignTeachers(subjectId, teacherIds, institutionId) {
    const subject = await Subject.findOne({ _id: subjectId, institution: institutionId });
    if (!subject) {
      throw ApiError.notFound('Subject not found');
    }

    subject.teachers = teacherIds;
    await subject.save();

    return subject;
  }
}

module.exports = new SubjectService();
