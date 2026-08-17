const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

const superAdminMiddleware = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
  }

  if (req.user.role !== 'superadmin') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Super admin authorization required');
  }

  return next();
});

module.exports = superAdminMiddleware;
