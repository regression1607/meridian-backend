const Joi = require('joi');
const ApiError = require('../utils/apiError');

const validate = (schema) => (req, res, next) => {
  const validSchema = {};
  const validKeys = ['params', 'query', 'body'];

  validKeys.forEach((key) => {
    if (schema[key]) {
      validSchema[key] = schema[key];
    }
  });

  const object = {};
  Object.keys(validSchema).forEach((key) => {
    object[key] = req[key];
  });

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(', ');
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return next(new ApiError(400, errorMessage, errorDetails));
  }

  Object.assign(req, value);
  return next();
};

module.exports = validate;
