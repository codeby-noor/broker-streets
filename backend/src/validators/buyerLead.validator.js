const Joi = require('joi');

const createBuyerLeadSchema = Joi.object({
  state: Joi.string().trim().default('Gujarat').optional(),
  district: Joi.string().trim().required(),
  taluka: Joi.string().trim().required(),
  preferredVillages: Joi.array().items(Joi.string().trim()).min(2).required().messages({
    'array.min': 'Please select at least two preferred villages',
  }),
  propertyType: Joi.string().valid('Agricultural Land', 'Non-Agricultural Land').required(),
  purpose: Joi.string().valid('Investment', 'Project', 'Personal Farm', 'Other').required(),
  purposeOther: Joi.when('purpose', {
    is: 'Other',
    then: Joi.string().trim().max(500).required().messages({
      'any.required': 'Please specify your purpose when selecting Other',
      'string.empty': 'Please specify your purpose when selecting Other',
    }),
    otherwise: Joi.string().trim().max(500).allow('').optional(),
  }),
  requirements: Joi.string().trim().max(2000).allow('').optional(),
  voiceRecording: Joi.string().allow('').optional(),
  images: Joi.array().items(Joi.string()).optional(),
  keepImages: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
});

const updateBuyerLeadSchema = Joi.object({
  state: Joi.string().trim().optional(),
  district: Joi.string().trim().optional(),
  taluka: Joi.string().trim().optional(),
  preferredVillages: Joi.array().items(Joi.string().trim()).min(2).optional(),
  propertyType: Joi.string().valid('Agricultural Land', 'Non-Agricultural Land').optional(),
  purpose: Joi.string().valid('Investment', 'Project', 'Personal Farm', 'Other').optional(),
  purposeOther: Joi.when('purpose', {
    is: 'Other',
    then: Joi.string().trim().max(500).required(),
    otherwise: Joi.string().trim().max(500).allow('').optional(),
  }),
  requirements: Joi.string().trim().max(2000).allow('').optional(),
  voiceRecording: Joi.string().allow('').optional(),
  images: Joi.array().items(Joi.string()).optional(),
  keepImages: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
});

const queryBuyerLeadSchema = Joi.object({
  district: Joi.string().trim().optional(),
  propertyType: Joi.string().valid('Agricultural Land', 'Non-Agricultural Land').optional(),
  purpose: Joi.string().valid('Investment', 'Project', 'Personal Farm', 'Other').optional(),
  status: Joi.string().valid('New', 'Hot', 'Contacted', 'Closed').optional(),
  sort: Joi.string().valid('newest', 'oldest').default('newest').optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  search: Joi.string().trim().allow('').optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('New', 'Hot', 'Contacted', 'Closed').required(),
});

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid buyer lead ID format',
    'string.hex': 'Invalid buyer lead ID format',
  }),
});

module.exports = {
  createBuyerLeadSchema,
  updateBuyerLeadSchema,
  queryBuyerLeadSchema,
  updateStatusSchema,
  idParamSchema,
};
