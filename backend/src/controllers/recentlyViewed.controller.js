// Item 5: RecentlyViewed Controller
const recentlyViewedService = require('../services/recentlyViewed.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

const getRecentlyViewed = asyncHandler(async (req, res) => {
  const items = await recentlyViewedService.getRecentlyViewed(req.user._id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, items, 'Recently viewed listings retrieved successfully')
  );
});

const recordView = asyncHandler(async (req, res) => {
  await recentlyViewedService.recordView(req.user._id, req.body.listingId);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { success: true }, 'Listing view recorded successfully')
  );
});

const removeRecentlyViewed = asyncHandler(async (req, res) => {
  await recentlyViewedService.removeRecentlyViewed(req.user._id, req.params.listingId);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

module.exports = {
  getRecentlyViewed,
  recordView,
  removeRecentlyViewed,
};
