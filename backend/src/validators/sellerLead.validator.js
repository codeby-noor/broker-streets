const Joi = require('joi');

const querySellerLeadSchema = Joi.object({
  district: Joi.string().trim().allow('').optional(),
  type: Joi.string().valid('Agricultural Land', 'Non-Agricultural Land').optional(),
  status: Joi.string().valid('New', 'Reviewed', 'Approved', 'Rejected').optional(),
  sort: Joi.string().valid('newest', 'oldest').default('newest').optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  search: Joi.string().trim().allow('').optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('New', 'Reviewed', 'Approved', 'Rejected').required(),
});

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid seller lead ID format',
    'string.hex': 'Invalid seller lead ID format',
    'any.required': 'Seller lead ID is required',
  }),
});

module.exports = {
  querySellerLeadSchema,
  updateStatusSchema,
  idParamSchema,
};
