// Item 6: Notification Validators
const Joi = require('joi');

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid notification ID format',
    'string.hex': 'Invalid notification ID format',
    'any.required': 'Notification ID is required',
  }),
});

module.exports = {
  idParamSchema,
};
