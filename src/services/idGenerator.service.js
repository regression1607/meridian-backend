const User = require('../models/User');
const Institution = require('../models/Institution');
const ApiError = require('../utils/apiError');

/**
 * Global ID Generator Service
 * Handles auto-generation of IDs for all user types:
 * - Student Admission Numbers
 * - Student Roll Numbers
 * - Teacher Employee IDs
 * - Staff Employee IDs
 */
class IdGeneratorService {
  
  /**
   * Default format configurations for each ID type
   */
  static DEFAULT_FORMATS = {
    admissionNumber: {
      prefix: '{CODE}',
      includeYear: true,
      padding: 3
    },
    teacherEmployeeId: {
      prefix: 'TCH',
      includeYear: true,
      padding: 3
    },
    staffEmployeeId: {
      prefix: 'STF',
      includeYear: true,
      padding: 3
    }
  };

  /**
   * Generate next ID based on type and institution
   * @param {string} institutionId - Institution ID
   * @param {string} idType - Type of ID: 'admissionNumber', 'teacherEmployeeId', 'staffEmployeeId'
   * @param {object} options - Additional options like classId, sectionId for roll numbers
   * @returns {Promise<object>} - Generated ID and metadata
   */
  async generateNextId(institutionId, idType, options = {}) {
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      throw ApiError.notFound('Institution not found');
    }

    const year = new Date().getFullYear();
    const yearShort = String(year).slice(-2);

    switch (idType) {
      case 'admissionNumber':
        return this._generateAdmissionNumber(institution, year, yearShort);
      case 'rollNumber':
        return this._generateRollNumber(institutionId, options.classId, options.sectionId);
      case 'teacherEmployeeId':
        return this._generateEmployeeId(institution, 'teacher', year, yearShort);
      case 'staffEmployeeId':
        return this._generateEmployeeId(institution, 'staff', year, yearShort);
      default:
        throw ApiError.badRequest(`Unknown ID type: ${idType}`);
    }
  }

  /**
   * Generate admission number for students
   */
  async _generateAdmissionNumber(institution, year, yearShort) {
    const settings = institution.config?.studentNumbering || {};
    const format = settings.admissionNumberFormat || '{CODE}{YEAR}';
    const padding = settings.admissionNumberPadding || 3;

    // Count existing students
    const studentCount = await User.countDocuments({
      institution: institution._id,
      role: 'student',
      isActive: true
    });

    const nextNumber = studentCount + 1;
    const paddedNumber = String(nextNumber).padStart(padding, '0');

    // Replace placeholders
    let admissionNumber = format
      .replace('{CODE}', institution.code)
      .replace('{YEAR}', year)
      .replace('{YY}', yearShort);
    
    admissionNumber += paddedNumber;

    return {
      id: admissionNumber,
      type: 'admissionNumber',
      format,
      nextNumber,
      institutionCode: institution.code
    };
  }

  /**
   * Generate roll number based on class/section
   */
  async _generateRollNumber(institutionId, classId, sectionId) {
    if (!classId) {
      throw ApiError.badRequest('Class ID is required for roll number generation');
    }

    const query = {
      institution: institutionId,
      role: 'student',
      isActive: true,
      'studentData.class': classId
    };

    if (sectionId) {
      query['studentData.section'] = sectionId;
    }

    const studentCount = await User.countDocuments(query);
    const nextRollNumber = studentCount + 1;

    return {
      id: String(nextRollNumber),
      type: 'rollNumber',
      currentCount: studentCount,
      classId,
      sectionId
    };
  }

  /**
   * Generate employee ID for teachers or staff
   */
  async _generateEmployeeId(institution, role, year, yearShort) {
    const settings = institution.config?.employeeNumbering || {};
    
    // Get role-specific settings or use defaults
    const roleKey = role === 'teacher' ? 'teacherEmployeeId' : 'staffEmployeeId';
    const defaultConfig = IdGeneratorService.DEFAULT_FORMATS[roleKey];
    
    const prefix = settings[`${role}Prefix`] || defaultConfig.prefix;
    const includeYear = settings[`${role}IncludeYear`] !== false;
    const padding = settings[`${role}Padding`] || defaultConfig.padding;

    // Count existing users of this role
    const userCount = await User.countDocuments({
      institution: institution._id,
      role: role,
      isActive: true
    });

    const nextNumber = userCount + 1;
    const paddedNumber = String(nextNumber).padStart(padding, '0');

    // Build the ID
    let employeeId = prefix;
    if (includeYear) {
      employeeId += yearShort;
    }
    employeeId += paddedNumber;

    return {
      id: employeeId,
      type: roleKey,
      prefix,
      nextNumber,
      institutionCode: institution.code
    };
  }

  /**
   * Get ID generation settings for an institution
   */
  async getSettings(institutionId) {
    const institution = await Institution.findById(institutionId)
      .select('code config.studentNumbering config.employeeNumbering');
    
    if (!institution) {
      throw ApiError.notFound('Institution not found');
    }

    return {
      institutionCode: institution.code,
      studentNumbering: institution.config?.studentNumbering || {
        admissionNumberFormat: '{CODE}{YEAR}',
        admissionNumberPadding: 3,
        rollNumberAutoGenerate: true
      },
      employeeNumbering: institution.config?.employeeNumbering || {
        teacherPrefix: 'TCH',
        teacherIncludeYear: true,
        teacherPadding: 3,
        staffPrefix: 'STF',
        staffIncludeYear: true,
        staffPadding: 3
      }
    };
  }

  /**
   * Update ID generation settings for an institution
   */
  async updateSettings(institutionId, settings) {
    const institution = await Institution.findById(institutionId);
    
    if (!institution) {
      throw ApiError.notFound('Institution not found');
    }

    if (!institution.config) {
      institution.config = {};
    }

    if (settings.studentNumbering) {
      institution.config.studentNumbering = {
        ...institution.config.studentNumbering,
        ...settings.studentNumbering
      };
    }

    if (settings.employeeNumbering) {
      institution.config.employeeNumbering = {
        ...institution.config.employeeNumbering,
        ...settings.employeeNumbering
      };
    }

    await institution.save();

    return {
      studentNumbering: institution.config.studentNumbering,
      employeeNumbering: institution.config.employeeNumbering
    };
  }
}

module.exports = new IdGeneratorService();
