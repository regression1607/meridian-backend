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
  }).min(1),
};

const getUsers = {
  query: Joi.object().keys({
    role: Joi.string().valid(...Object.values(ROLES)),
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
