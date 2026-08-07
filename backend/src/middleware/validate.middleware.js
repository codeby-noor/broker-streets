const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

const validate = (schema) => (req, res, next) => {
  const objectToValidate = {};
  if (schema.body) objectToValidate.body = req.body;
  if (schema.query) objectToValidate.query = req.query;
  if (schema.params) objectToValidate.params = req.params;

  const { error, value } = schema.validate ? schema.validate(req.body, { abortEarly: false, stripUnknown: true }) : Joi.compile(schema).validate(objectToValidate, { abortEarly: false, stripUnknown: true });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, ''),
    }));
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation error', errorDetails));
  }

  if (schema.body && value.body) req.body = value.body;
  else if (!schema.body && !schema.query && !schema.params) req.body = value;

  return next();
};

module.exports = validate;
