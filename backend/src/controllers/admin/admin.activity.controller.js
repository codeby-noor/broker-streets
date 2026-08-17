const AdminActivityLog = require('../../models/AdminActivityLog');
const escapeRegex = require('../../utils/escapeRegex');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { HTTP_STATUS } = require('../../utils/constants');

const getAdminActivity = asyncHandler(async (req, res) => {
  const {
    mobile,
    status,
    search,
    sort = 'newest',
    page = 1,
    limit = 20,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const preMatch = {};

  if (mobile && mobile.toLowerCase() !== 'all') {
    preMatch.mobile = String(mobile).replace(/\D/g, '');
  }

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    preMatch.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { mobile: { $regex: escaped, $options: 'i' } },
      { role: { $regex: escaped, $options: 'i' } },
      { ip: { $regex: escaped, $options: 'i' } },
      { sessionId: { $regex: escaped, $options: 'i' } },
      { sessionInfo: { $regex: escaped, $options: 'i' } },
    ];
  }

  const pipeline = [];

  if (Object.keys(preMatch).length > 0) {
    pipeline.push({ $match: preMatch });
  }

  pipeline.push(
    {
      $group: {
        _id: '$sessionId',
        sessionId: { $first: '$sessionId' },
        adminId: { $first: '$adminId' },
        mobile: { $first: '$mobile' },
        name: { $first: '$name' },
        role: { $first: '$role' },
        loginAt: {
          $max: {
            $cond: [{ $eq: ['$type', 'login'] }, '$createdAt', null],
          },
        },
        logoutAt: {
          $max: {
            $cond: [{ $eq: ['$type', 'logout'] }, '$createdAt', null],
          },
        },
        hasLogout: {
          $max: {
            $cond: [{ $eq: ['$type', 'logout'] }, 1, 0],
          },
        },
        firstCreatedAt: { $min: '$createdAt' },
        latestCreatedAt: { $max: '$createdAt' },
      },
    },
    {
      $addFields: {
        id: '$sessionId',
        status: {
          $cond: [{ $eq: ['$hasLogout', 1] }, 'Logged Out', 'Login'],
        },
        effectiveTime: {
          $ifNull: ['$loginAt', '$firstCreatedAt'],
        },
      },
    }
  );

  // Post-group filter for merged session status
  if (status && status.toLowerCase() !== 'all') {
    const s = status.toLowerCase();
    if (s === 'active' || s === 'login') {
      pipeline.push({ $match: { status: 'Login' } });
    } else if (s.includes('logout') || s === 'logged out') {
      pipeline.push({ $match: { status: 'Logged Out' } });
    }
  }

  const sortOrder = sort === 'oldest' ? 1 : -1;

  pipeline.push({
    $facet: {
      data: [
        { $sort: { effectiveTime: sortOrder, _id: sortOrder } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $project: {
            _id: 0,
            id: '$sessionId',
            sessionId: 1,
            adminId: 1,
            mobile: 1,
            name: 1,
            role: 1,
            loginAt: 1,
            logoutAt: 1,
            status: 1,
          },
        },
      ],
      totalCount: [{ $count: 'count' }],
    },
  });

  const result = await AdminActivityLog.aggregate(pipeline);
  const data = result[0]?.data || [];
  const total = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(total / limitNum) || 1;

  const meta = {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
  };

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, data, 'Admin activity logs retrieved successfully', meta)
  );
});

module.exports = {
  getAdminActivity,
};
