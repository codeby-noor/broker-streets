const Joi = require('joi');

const createListingSchema = Joi.object({
  title: Joi.string().trim().max(200).optional(),
  type: Joi.string().valid('Agricultural Land', 'Non-Agricultural Land').required(),
  state: Joi.string().trim().default('Gujarat').optional(),
  district: Joi.string().trim().required(),
  subDistrict: Joi.string().trim().allow('').optional(),
  taluka: Joi.string().trim().allow('').optional(),
  village: Joi.string().trim().allow('').optional(),
  priceUnit: Joi.string().valid('Vigha', 'Sq.Yard (Var)', 'Sq.Ft', '').allow('').optional(),
  priceAmount: Joi.number().min(0).optional(),
  landArea: Joi.string().trim().allow('').optional(),
  mapLink: Joi.string()
    .trim()
    .allow('')
    .pattern(/^https?:\/\/.+/)
    .optional()
    .messages({ 'string.pattern.base': 'Map link must be a valid URL starting with http:// or https://' }),
  additionalDetails: Joi.string().trim().max(2000).allow('').optional(),
  images: Joi.array().items(Joi.string()).optional(),
  videos: Joi.array().items(Joi.string()).optional(),
  propertyDocument: Joi.object({
    name: Joi.string().allow('').optional(),
    url: Joi.string().allow('').optional(),
    type: Joi.string().allow('').optional(),
    size: Joi.number().optional(),
  })
    .allow(null)
    .optional(),
  status: Joi.string().valid('Available', 'Pending', 'Sold').default('Available').optional(),
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim().max(200).optional(),
  type: Joi.string().valid('Agricultural Land', 'Non-Agricultural Land').optional(),
  state: Joi.string().trim().optional(),
  district: Joi.string().trim().optional(),
  subDistrict: Joi.string().trim().allow('').optional(),
  taluka: Joi.string().trim().allow('').optional(),
  village: Joi.string().trim().allow('').optional(),
  priceUnit: Joi.string().valid('Vigha', 'Sq.Yard (Var)', 'Sq.Ft', '').allow('').optional(),
  priceAmount: Joi.number().min(0).optional(),
  landArea: Joi.string().trim().allow('').optional(),
  mapLink: Joi.string()
    .trim()
    .allow('')
    .pattern(/^https?:\/\/.+/)
    .optional()
    .messages({ 'string.pattern.base': 'Map link must be a valid URL starting with http:// or https://' }),
  additionalDetails: Joi.string().trim().max(2000).allow('').optional(),
  images: Joi.array().items(Joi.string()).optional(),
  videos: Joi.array().items(Joi.string()).optional(),
  propertyDocument: Joi.object({
    name: Joi.string().allow('').optional(),
    url: Joi.string().allow('').optional(),
    type: Joi.string().allow('').optional(),
    size: Joi.number().optional(),
  })
    .allow(null)
    .optional(),
  status: Joi.string().valid('Available', 'Pending', 'Sold').optional(),
});

const adminUpdateListingSchema = updateListingSchema.keys({
  verified: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
});

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid property ID format',
    'string.hex': 'Invalid property ID format',
  }),
});

const queryListingSchema = Joi.object({
  district: Joi.string().trim().optional(),
  taluka: Joi.string().trim().optional(),
  subDistrict: Joi.string().trim().optional(),
  village: Joi.string().trim().optional(),
  type: Joi.string().valid('Agricultural Land', 'Non-Agricultural Land').optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  landArea: Joi.string().trim().optional(),
  status: Joi.string().valid('Available', 'Pending', 'Sold').optional(),
  sort: Joi.string().valid('newest', 'oldest', 'price_asc', 'price_desc').default('newest').optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  search: Joi.string().trim().allow('').optional(),
  verified: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('Available', 'Pending', 'Sold').required(),
});

const adminUpdateFeaturedSchema = Joi.object({
  featured: Joi.boolean().required(),
});

const adminUpdateVerifiedSchema = Joi.object({
  verified: Joi.boolean().required(),
});

const adminBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
});

module.exports = {
  createListingSchema,
  updateListingSchema,
  adminUpdateListingSchema,
  idParamSchema,
  queryListingSchema,
  updateStatusSchema,
  adminUpdateFeaturedSchema,
  adminUpdateVerifiedSchema,
  adminBulkDeleteSchema,
};
