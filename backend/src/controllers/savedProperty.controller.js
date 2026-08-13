// Item 4: SavedProperty Controller
const savedPropertyService = require('../services/savedProperty.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

const getSavedProperties = asyncHandler(async (req, res) => {
  const listings = await savedPropertyService.getSavedProperties(req.user._id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, listings, 'Saved properties retrieved successfully')
  );
});

const toggleSaveProperty = asyncHandler(async (req, res) => {
  const result = await savedPropertyService.toggleSaveProperty(
    req.user._id,
    req.body.listingId
  );
  const message = result.saved
    ? 'Property saved successfully'
    : 'Property removed from saved listings';
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, message));
});

const removeSavedProperty = asyncHandler(async (req, res) => {
  await savedPropertyService.removeSavedProperty(req.user._id, req.params.listingId);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

const checkSaved = asyncHandler(async (req, res) => {
  const result = await savedPropertyService.checkIsSaved(req.user._id, req.params.listingId);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'Checked saved status successfully')
  );
});

module.exports = {
  getSavedProperties,
  toggleSaveProperty,
  removeSavedProperty,
  checkSaved,
};
