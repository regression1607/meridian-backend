const Class = require('../models/Class');
const Section = require('../models/Section');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

class ClassService {
  async getClasses(institutionId, options = {}) {
    const { page = 1, limit = 50, academicYear, isActive = true } = options;
    const skip = (page - 1) * limit;

    const query = { institution: institutionId };
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive;

    const [classes, total] = await Promise.all([
      Class.find(query)
        .populate('sections', 'name room')
        .populate('classTeacher', 'profile.firstName profile.lastName email')
        .sort({ grade: 1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Class.countDocuments(query)
    ]);

    // Get student counts for each class
    const classIds = classes.map(c => c._id);
    const studentCounts = await User.aggregate([
      {
        $match: {
          'studentData.class': { $in: classIds },
          isActive: true,
          role: 'student'
        }
      },
      {
        $group: {
          _id: '$studentData.class',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map for quick lookup
    const countMap = {};
    studentCounts.forEach(item => {
      countMap[item._id.toString()] = item.count;
    });

    // Add studentCount to each class
    const classesWithCounts = classes.map(c => ({
      ...c,
      studentCount: countMap[c._id.toString()] || 0
    }));

    return {
      data: classesWithCounts,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getClassById(id, institutionId) {
    const classDoc = await Class.findOne({ _id: id, institution: institutionId })
      .populate('sections')
      .populate('classTeacher', 'profile.firstName profile.lastName email')
      .populate('subjects', 'name code');

    if (!classDoc) {
      throw ApiError.notFound('Class not found');
    }
    return classDoc;
  }

  async createClass(data, institutionId) {
    const existing = await Class.findOne({
      institution: institutionId,
      name: data.name,
      academicYear: data.academicYear
    });

    if (existing) {
      throw ApiError.conflict('Class already exists for this academic year');
    }

    const classDoc = await Class.create({
      ...data,
      institution: institutionId
    });

    // Create default sections if provided
    if (data.sectionNames && data.sectionNames.length > 0) {
      const sections = await Promise.all(
        data.sectionNames.map(name => 
          Section.create({
            name,
            class: classDoc._id,
            institution: institutionId
          })
        )
      );
      classDoc.sections = sections.map(s => s._id);
      await classDoc.save();
    }

    return classDoc;
  }

  async updateClass(id, data, institutionId) {
    const classDoc = await Class.findOne({ _id: id, institution: institutionId });
    if (!classDoc) {
      throw ApiError.notFound('Class not found');
    }

    const allowedFields = ['name', 'code', 'grade', 'classTeacher', 'maxStudents', 'isActive'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        classDoc[field] = data[field];
      }
    });

    await classDoc.save();
    return classDoc;
  }

  async deleteClass(id, institutionId) {
    const classDoc = await Class.findOne({ _id: id, institution: institutionId });
    if (!classDoc) {
      throw ApiError.notFound('Class not found');
    }

    // Check if there are students in this class
    const studentCount = await User.countDocuments({
      'studentData.class': id,
      isActive: true
    });

    if (studentCount > 0) {
      throw ApiError.badRequest(`Cannot delete class with ${studentCount} active students`);
    }

    // Delete associated sections
    await Section.deleteMany({ class: id });
    await classDoc.deleteOne();

    return { message: 'Class deleted successfully' };
  }

  async getClassStudents(classId, sectionId, institutionId) {
    const query = {
      institution: institutionId,
      role: 'student',
      'studentData.class': classId,
      isActive: true
    };

    if (sectionId) {
      query['studentData.section'] = sectionId;
    }

    const students = await User.find(query)
      .select('profile.firstName profile.lastName email studentData.rollNumber studentData.admissionNumber')
      .sort({ 'studentData.rollNumber': 1 })
      .lean();

    return students;
  }

  // Section methods
  async getSections(classId, institutionId) {
    const sections = await Section.find({ class: classId, institution: institutionId })
      .populate('classTeacher', 'profile.firstName profile.lastName')
      .sort({ name: 1 })
      .lean();

    return sections;
  }

  async createSection(classId, data, institutionId) {
    const classDoc = await Class.findOne({ _id: classId, institution: institutionId });
    if (!classDoc) {
      throw ApiError.notFound('Class not found');
    }

    const existing = await Section.findOne({ class: classId, name: data.name });
    if (existing) {
      throw ApiError.conflict('Section already exists in this class');
    }

    const section = await Section.create({
      ...data,
      class: classId,
      institution: institutionId
    });

    classDoc.sections.push(section._id);
    await classDoc.save();

    return section;
  }

  async updateSection(sectionId, data, institutionId) {
    const section = await Section.findOne({ _id: sectionId, institution: institutionId });
    if (!section) {
      throw ApiError.notFound('Section not found');
    }

    // Check if name is being changed and if it conflicts with another section
    if (data.name && data.name !== section.name) {
      const existing = await Section.findOne({ 
        class: section.class, 
        name: data.name,
        _id: { $ne: sectionId }
      });
      if (existing) {
        throw ApiError.conflict('Section name already exists in this class');
      }
    }

    const allowedFields = ['name', 'classTeacher', 'maxStudents', 'room', 'isActive'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        section[field] = data[field];
      }
    });

    await section.save();
    return section;
  }

  async deleteSection(sectionId, institutionId) {
    const section = await Section.findOne({ _id: sectionId, institution: institutionId });
    if (!section) {
      throw ApiError.notFound('Section not found');
    }

    const studentCount = await User.countDocuments({
      'studentData.section': sectionId,
      isActive: true
    });

    if (studentCount > 0) {
      throw ApiError.badRequest(`Cannot delete section with ${studentCount} active students`);
    }

    // Remove from class
    await Class.updateOne(
      { _id: section.class },
      { $pull: { sections: sectionId } }
    );

    await section.deleteOne();
    return { message: 'Section deleted successfully' };
  }

  // Public endpoint - returns only active classes with basic info
  async getPublicClasses(institutionId) {
    const classes = await Class.find({ 
      institution: institutionId, 
      isActive: true 
    })
      .select('_id name grade')
      .sort({ grade: 1, name: 1 })
      .lean();
    return classes;
  }
}

module.exports = new ClassService();
