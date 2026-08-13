// Item 5: RecentlyViewed Validators
const Joi = require('joi');

const recordViewSchema = Joi.object({
  listingId: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid listing ID format',
    'string.hex': 'Invalid listing ID format',
    'any.required': 'Listing ID is required',
  }),
});

const listingIdParamSchema = Joi.object({
  listingId: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid listing ID format',
    'string.hex': 'Invalid listing ID format',
    'any.required': 'Listing ID is required',
  }),
});

module.exports = {
  recordViewSchema,
  listingIdParamSchema,
};
