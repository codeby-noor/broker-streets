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

const completeProfileSchema = Joi.object({
  phoneNumber: Joi.string().trim().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'Mobile number must be exactly 10 digits',
  }),
  mobile: Joi.string().trim().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'Mobile number must be exactly 10 digits',
  }),
  city: Joi.string().trim().allow('').optional(),
}).or('phoneNumber', 'mobile');

module.exports = {
  updateProfileSchema,
  completeProfileSchema,
};