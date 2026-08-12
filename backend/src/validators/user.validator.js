const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name must be at least 2 characters',
  }),
  email: Joi.string().trim().email().allow('').optional().messages({
    'string.email': 'Enter a valid email address',
  }),
  whatsapp: Joi.string().trim().allow('').optional().messages({
    'string.empty': 'WhatsApp number cannot be empty',
  }),
  district: Joi.string().trim().allow('').optional(),
  subDistrict: Joi.string().trim().allow('').optional(),
  address: Joi.string().trim().allow('').optional(),
});

module.exports = {
  updateProfileSchema,
};