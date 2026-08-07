const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user) => {
  const payload = {
    userId: user._id || user.id,
    mobile: user.mobile,
    role: user.role || 'user',
    tokenVersion: user.tokenVersion || 0,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id || user.id,
    mobile: user.mobile,
    tokenVersion: user.tokenVersion || 0,
  };
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
