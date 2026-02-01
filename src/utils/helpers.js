const crypto = require('crypto');
const slugify = require('slugify');

const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

const generateCode = (prefix = '', length = 6) => {
  const randomPart = Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  return prefix ? `${prefix}-${randomPart}` : randomPart;
};

const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true
  });
};

const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

const sanitizeObject = (obj, allowedFields) => {
  const sanitized = {};
  allowedFields.forEach(field => {
    if (obj[field] !== undefined) {
      sanitized[field] = obj[field];
    }
  });
  return sanitized;
};

const parseQueryFilters = (query, allowedFilters = []) => {
  const filters = {};
  
  allowedFilters.forEach(filter => {
    if (query[filter] !== undefined && query[filter] !== '') {
      filters[filter] = query[filter];
    }
  });
  
  return filters;
};

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

const getSortParams = (query, defaultSort = '-createdAt') => {
  const sortBy = query.sortBy || defaultSort;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  
  const sort = {};
  sort[sortBy.replace('-', '')] = sortBy.startsWith('-') ? -1 : sortOrder;
  
  return sort;
};

const generatePassword = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '@$!%*?&';
  const all = lowercase + uppercase + numbers + special;
  
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

module.exports = {
  generateRandomString,
  generateCode,
  generateSlug,
  generateOTP,
  generatePassword,
  formatDate,
  calculateAge,
  sanitizeObject,
  parseQueryFilters,
  getPaginationParams,
  getSortParams
};
