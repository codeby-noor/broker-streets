const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Name must be at least 2 characters',
  }),
  mobile: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.empty': 'Mobile number is required',
      'string.pattern.base': 'Enter a valid 10-digit mobile number',
    }),
  email: Joi.string().trim().email().allow('').optional().messages({
    'string.email': 'Enter a valid email address',
  }),
  city: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'City is required',
  }),
  state: Joi.string().trim().optional(),
  district: Joi.string().trim().allow('').optional(),
  subDistrict: Joi.string().trim().allow('').optional(),
});

const sendOtpSchema = Joi.object({
  mobile: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.empty': 'Mobile number is required',
      'string.pattern.base': 'Enter a valid 10-digit mobile number',
    }),
});

const verifyOtpSchema = Joi.object({
  mobile: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.empty': 'Mobile number is required',
      'string.pattern.base': 'Enter a valid 10-digit mobile number',
    }),
  otp: Joi.string()
    .trim()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      'string.empty': 'OTP is required',
      'string.pattern.base': 'Enter a valid 6-digit OTP',
    }),
  name: Joi.string().trim().min(2).max(100).optional(),
  city: Joi.string().trim().optional(),
  email: Joi.string().trim().email().allow('').optional(),
  state: Joi.string().trim().optional(),
  district: Joi.string().trim().allow('').optional(),
  subDistrict: Joi.string().trim().allow('').optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required().messages({
    'string.empty': 'Refresh token is required',
  }),
});

module.exports = {
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
};
