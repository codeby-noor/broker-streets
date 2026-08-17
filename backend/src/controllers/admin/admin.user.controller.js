const User = require('../../models/User');
const BuyerLead = require('../../models/BuyerLead');
const SellerLead = require('../../models/SellerLead');
const Listing = require('../../models/Listing');
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

  const matchFilter = {};

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    matchFilter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { mobile: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { city: { $regex: escaped, $options: 'i' } },
      { district: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (status && status.toLowerCase() !== 'all') {
    if (status.toLowerCase() === 'active') {
      matchFilter.isActive = true;
    } else if (status.toLowerCase() === 'inactive') {
      matchFilter.isActive = false;
    }
  }

  const pipeline = [];

  if (Object.keys(matchFilter).length > 0) {
    pipeline.push({ $match: matchFilter });
  }

  // Lookups across buyerleads, sellerleads, and listings to compute derived role
  pipeline.push(
    {
      $lookup: {
        from: 'buyerleads',
        let: { uId: '$_id', uMobile: '$mobile' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$userId', '$$uId'] },
                  {
                    $and: [
                      { $ne: ['$userMobile', ''] },
                      { $eq: ['$userMobile', '$$uMobile'] },
                    ],
                  },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'buyerMatches',
      },
    },
    {
      $lookup: {
        from: 'sellerleads',
        let: { uId: '$_id', uMobile: '$mobile' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$userId', '$$uId'] },
                  {
                    $and: [
                      { $ne: ['$userMobile', ''] },
                      { $eq: ['$userMobile', '$$uMobile'] },
                    ],
                  },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'sellerLeadMatches',
      },
    },
    {
      $lookup: {
        from: 'listings',
        let: { uId: '$_id', uMobile: '$mobile' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$userId', '$$uId'] },
                  {
                    $and: [
                      { $ne: ['$ownerMobile', ''] },
                      { $eq: ['$ownerMobile', '$$uMobile'] },
                    ],
                  },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'listingMatches',
      },
    },
    {
      $addFields: {
        isBuyer: { $gt: [{ $size: '$buyerMatches' }, 0] },
        isSeller: {
          $or: [
            { $gt: [{ $size: '$sellerLeadMatches' }, 0] },
            { $gt: [{ $size: '$listingMatches' }, 0] },
          ],
        },
      },
    },
    {
      $addFields: {
        role: {
          $cond: [
            { $and: ['$isBuyer', '$isSeller'] },
            'Buyer & Seller',
            {
              $cond: [
                '$isBuyer',
                'Buyer',
                {
                  $cond: ['$isSeller', 'Seller', 'Buyer'],
                },
              ],
            },
          ],
        },
      },
    }
  );

  // Filter by derived role if specified
  if (role && role.toLowerCase() !== 'all') {
    const r = role.trim().toLowerCase();
    let targetPattern;
    if (r === 'buyer & seller' || r === 'buyer and seller' || r === 'buyer_seller') {
      targetPattern = '^Buyer & Seller$';
    } else if (r === 'buyer' || r === 'buyers') {
      targetPattern = '^Buyer$';
    } else if (r === 'seller' || r === 'sellers') {
      targetPattern = '^Seller$';
    } else {
      targetPattern = `^${escapeRegex(role.trim())}$`;
    }

    pipeline.push({
      $match: {
        role: { $regex: new RegExp(targetPattern, 'i') },
      },
    });
  }

  let sortCriteria = { createdAt: -1 };
  if (sort === 'oldest') {
    sortCriteria = { createdAt: 1 };
  } else if (sort === 'name') {
    sortCriteria = { name: 1 };
  }

  pipeline.push({
    $facet: {
      data: [
        { $sort: sortCriteria },
        { $skip: skip },
        { $limit: limitNum },
        {
          $project: {
            buyerMatches: 0,
            sellerLeadMatches: 0,
            listingMatches: 0,
            isBuyer: 0,
            isSeller: 0,
            __v: 0,
          },
        },
      ],
      totalCount: [{ $count: 'count' }],
    },
  });

  const result = await User.aggregate(pipeline);
  const rawUsers = result[0]?.data || [];
  const total = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(total / limitNum) || 1;

  const users = rawUsers.map((u) => {
    const obj = { ...u, id: u._id.toString() };
    delete obj._id;
    return obj;
  });

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

  const [hasBuyerLead, hasSellerLead, hasListing] = await Promise.all([
    BuyerLead.exists({
      $or: [{ userId: user._id }, { userMobile: user.mobile }],
    }),
    SellerLead.exists({
      $or: [{ userId: user._id }, { userMobile: user.mobile }],
    }),
    Listing.exists({
      $or: [{ userId: user._id }, { ownerMobile: user.mobile }],
    }),
  ]);

  const isBuyer = Boolean(hasBuyerLead);
  const isSeller = Boolean(hasSellerLead || hasListing);

  let derivedRole = 'Buyer';
  if (isBuyer && isSeller) {
    derivedRole = 'Buyer & Seller';
  } else if (isBuyer) {
    derivedRole = 'Buyer';
  } else if (isSeller) {
    derivedRole = 'Seller';
  }

  const userObj = user.toJSON();
  userObj.role = derivedRole;

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, userObj, 'User details retrieved successfully')
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
