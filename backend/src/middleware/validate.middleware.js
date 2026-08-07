const Joi = require('joi');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

const validate = (schema) => (req, res, next) => {
  // Item 7: Support both container schemas { body, query, params } and direct Joi schemas
  const isJoiSchema = schema && typeof schema.validate === 'function';

  let error;
  let value;

  if (isJoiSchema) {
    ({ error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true }));
    if (!error) {
      req.body = value;
    }
  } else {
    const objectToValidate = {};
    if (schema.body) objectToValidate.body = req.body;
    if (schema.query) objectToValidate.query = req.query;
    if (schema.params) objectToValidate.params = req.params;

    const compiledSchema = Joi.compile(schema);
    ({ error, value } = compiledSchema.validate(objectToValidate, { abortEarly: false, stripUnknown: true }));

    if (!error) {
      if (value.body) req.body = value.body;
      if (value.query) req.query = value.query;
      if (value.params) req.params = value.params;
    }
  }

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, ''),
    }));
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation error', errorDetails));
  }

  return next();
};

module.exports = validate;
