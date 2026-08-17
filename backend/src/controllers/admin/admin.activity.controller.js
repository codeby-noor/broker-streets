const AdminActivityLog = require('../../models/AdminActivityLog');
const escapeRegex = require('../../utils/escapeRegex');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { HTTP_STATUS } = require('../../utils/constants');

const getAdminActivity = asyncHandler(async (req, res) => {
  const {
    mobile,
    status,
    type,
    search,
    sort = 'newest',
    page = 1,
    limit = 20,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (mobile && mobile.toLowerCase() !== 'all') {
    filter.mobile = String(mobile).replace(/\D/g, '');
  }

  if (type && type.toLowerCase() !== 'all') {
    filter.type = type.toLowerCase();
  }

  if (status && status.toLowerCase() !== 'all') {
    const s = status.toLowerCase();
    if (s === 'active' || s === 'login') {
      filter.type = 'login';
    } else if (s === 'logged out' || s === 'logout') {
      filter.type = 'logout';
    }
  }

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { mobile: { $regex: escaped, $options: 'i' } },
      { role: { $regex: escaped, $options: 'i' } },
      { ip: { $regex: escaped, $options: 'i' } },
      { sessionInfo: { $regex: escaped, $options: 'i' } },
    ];
  }

  const sortOrder = sort === 'oldest' ? 1 : -1;

  const [logs, total] = await Promise.all([
    AdminActivityLog.find(filter)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limitNum),
    AdminActivityLog.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  const meta = {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
  };

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, logs, 'Admin activity logs retrieved successfully', meta)
  );
});

module.exports = {
  getAdminActivity,
};
