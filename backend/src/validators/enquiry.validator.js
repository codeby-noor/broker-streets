const Joi = require('joi');

const createEnquirySchema = Joi.object({
  listingId: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid listing ID format',
    'string.hex': 'Invalid listing ID format',
    'any.required': 'Listing ID is required',
  }),
  message: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Message is required',
    'string.max': 'Message cannot exceed 2000 characters',
    'any.required': 'Message is required',
  }),
  phone: Joi.string().trim().allow('').optional(),
  email: Joi.string().trim().email().allow('').optional(),
});

const queryEnquirySchema = Joi.object({
  status: Joi.string().valid('Pending', 'Replied', 'Closed').optional(),
  sort: Joi.string().valid('newest', 'oldest').default('newest').optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  search: Joi.string().trim().allow('').optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'Replied', 'Closed').required(),
});

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid enquiry ID format',
    'string.hex': 'Invalid enquiry ID format',
  }),
});

module.exports = {
  createEnquirySchema,
  queryEnquirySchema,
  updateStatusSchema,
  idParamSchema,
};
