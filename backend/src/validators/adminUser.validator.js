const Joi = require('joi');

const queryAdminUsersSchema = Joi.object({
  search: Joi.string().trim().allow('').optional(),
  status: Joi.string().trim().allow('').optional(),
  role: Joi.string().trim().allow('').optional(),
  sort: Joi.string().valid('newest', 'oldest', 'name').default('newest').optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});

const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  status: Joi.string().valid('Active', 'Inactive', 'active', 'inactive').optional(),
});

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid user ID format',
    'string.hex': 'Invalid user ID format',
    'any.required': 'User ID is required',
  }),
});

module.exports = {
  queryAdminUsersSchema,
  updateUserStatusSchema,
  idParamSchema,
};
