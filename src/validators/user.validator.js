const Joi = require('joi');
const { ROLES } = require('../config/constants');

const createUser = {
  body: Joi.object().keys({
    firstName: Joi.string().required().trim().min(2).max(50),
    lastName: Joi.string().required().trim().min(2).max(50),
    email: Joi.string().required().email().lowercase().trim(),
    password: Joi.string().min(8).max(128),
    role: Joi.string().valid(...Object.values(ROLES)).required(),
    institutionId: Joi.string().hex().length(24), // MongoDB ObjectId for platform admins
    phone: Joi.string().pattern(/^[+]?[\d\s-]{10,15}$/),
    dateOfBirth: Joi.date().max('now'),
    gender: Joi.string().valid('male', 'female', 'other'),
    address: Joi.object().keys({
      street: Joi.string().trim(),
      city: Joi.string().trim(),
      state: Joi.string().trim(),
      pincode: Joi.string().trim(),
      country: Joi.string().trim().default('India'),
    }),
    teacherProfile: Joi.object().keys({
      employeeId: Joi.string().trim(),
      department: Joi.string(),
      subjects: Joi.array().items(Joi.string()),
      qualifications: Joi.array().items(Joi.string()),
      joiningDate: Joi.date(),
    }),
    studentProfile: Joi.object().keys({
      admissionNumber: Joi.string().trim(),
      rollNumber: Joi.string().trim(),
      class: Joi.string(),
      section: Joi.string(),
      admissionDate: Joi.date(),
      parentId: Joi.string(),
    }),
    parentProfile: Joi.object().keys({
      occupation: Joi.string().trim(),
      relation: Joi.string().valid('father', 'mother', 'guardian'),
      children: Joi.array().items(Joi.string()),
    }),
    staffProfile: Joi.object().keys({
      employeeId: Joi.string().trim(),
      department: Joi.string().trim(),
      designation: Joi.string().trim(),
      joiningDate: Joi.date(),
    }),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    firstName: Joi.string().trim().min(2).max(50),
    lastName: Joi.string().trim().min(2).max(50),
    email: Joi.string().email().lowercase().trim(),
    phone: Joi.string().pattern(/^[+]?[\d\s-]{10,15}$/),
    dateOfBirth: Joi.date().max('now'),
    gender: Joi.string().valid('male', 'female', 'other'),
    address: Joi.object().keys({
      street: Joi.string().trim(),
      city: Joi.string().trim(),
      state: Joi.string().trim(),
      pincode: Joi.string().trim(),
      country: Joi.string().trim(),
    }),
    isActive: Joi.boolean(),
    role: Joi.string().valid(...Object.values(ROLES)),
    profile: Joi.object().keys({
      firstName: Joi.string().trim().min(2).max(50),
      lastName: Joi.string().trim().min(2).max(50),
      phone: Joi.string().pattern(/^[+]?[\d\s-]{10,15}$/).allow('', null),
      dateOfBirth: Joi.date().max('now').allow(null),
      gender: Joi.string().valid('male', 'female', 'other').allow('', null),
      address: Joi.object().keys({
        street: Joi.string().trim().allow(''),
        city: Joi.string().trim().allow(''),
        state: Joi.string().trim().allow(''),
        pincode: Joi.string().trim().allow(''),
        country: Joi.string().trim().allow(''),
      }),
    }),
    teacherProfile: Joi.object().keys({
      employeeId: Joi.string().trim().allow('', null),
      department: Joi.string().allow('', null),
      subjects: Joi.array().items(Joi.string()),
      qualifications: Joi.string().allow('', null),
      joiningDate: Joi.date().allow(null),
    }),
    studentProfile: Joi.object().keys({
      admissionNumber: Joi.string().trim().allow('', null),
      rollNumber: Joi.string().trim().allow('', null),
      class: Joi.string().allow('', null),
      section: Joi.string().allow('', null),
      admissionDate: Joi.date().allow(null),
      parentId: Joi.string().allow('', null),
    }),
    parentProfile: Joi.object().keys({
      occupation: Joi.string().trim().allow('', null),
      relation: Joi.string().valid('father', 'mother', 'guardian').allow('', null),
      children: Joi.array().items(Joi.string()),
    }),
    staffProfile: Joi.object().keys({
      employeeId: Joi.string().trim().allow('', null),
      department: Joi.string().trim().allow('', null),
      designation: Joi.string().trim().allow('', null),
      joiningDate: Joi.date().allow(null),
    }),
  }).min(1),
};

const getUsers = {
  query: Joi.object().keys({
    role: Joi.string().custom((value, helpers) => {
      // Allow comma-separated roles
      const roles = value.split(',').map(r => r.trim());
      const validRoles = Object.values(ROLES);
      for (const role of roles) {
        if (!validRoles.includes(role)) {
          return helpers.error('any.invalid');
        }
      }
      return value;
    }),
    search: Joi.string().trim(),
    class: Joi.string(),
    section: Joi.string(),
    department: Joi.string(),
    isActive: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

module.exports = {
  createUser,
  updateUser,
  getUsers,
};
