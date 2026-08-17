const User = require('../../models/User');
const escapeRegex = require('../../utils/escapeRegex');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { HTTP_STATUS } = require('../../utils/constants');

const getAdminUsers = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    role,
    sort = 'newest',
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { mobile: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { city: { $regex: escaped, $options: 'i' } },
      { district: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (status && status.toLowerCase() !== 'all') {
    if (status.toLowerCase() === 'active') {
      filter.isActive = true;
    } else if (status.toLowerCase() === 'inactive') {
      filter.isActive = false;
    }
  }

  if (role && role.toLowerCase() !== 'all') {
    filter.role = role.toLowerCase();
  }

  let sortCriteria = { createdAt: -1 };
  if (sort === 'oldest') {
    sortCriteria = { createdAt: 1 };
  } else if (sort === 'name') {
    sortCriteria = { name: 1 };
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort(sortCriteria).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  const meta = {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
  };

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, users, 'Admin users retrieved successfully', meta)
  );
});

const getAdminUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, user, 'User details retrieved successfully')
  );
});

const updateAdminUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  let newActive;
  if (req.body.isActive !== undefined) {
    newActive = Boolean(req.body.isActive);
  } else if (req.body.status) {
    newActive = req.body.status.toLowerCase() === 'active';
  } else {
    newActive = !user.isActive;
  }

  user.isActive = newActive;
  if (!newActive) {
    user.tokenVersion += 1;
  }

  await user.save();

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, user, 'User status updated successfully')
  );
});

module.exports = {
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
};
