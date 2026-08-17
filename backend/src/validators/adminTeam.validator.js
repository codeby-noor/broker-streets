const Joi = require('joi');

const createAdminUserSchema = Joi.object({
  mobile: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.empty': 'Mobile number is required',
      'string.pattern.base': 'Enter a valid 10-digit mobile number',
      'any.required': 'Mobile number is required',
    }),
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  role: Joi.string().valid('admin', 'superadmin').default('admin').optional(),
});

const updateAdminUserStatusSchema = Joi.object({
  isActive: Joi.boolean().optional(),
});

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid admin ID format',
    'string.hex': 'Invalid admin ID format',
    'any.required': 'Admin ID is required',
  }),
});

module.exports = {
  createAdminUserSchema,
  updateAdminUserStatusSchema,
  idParamSchema,
};
