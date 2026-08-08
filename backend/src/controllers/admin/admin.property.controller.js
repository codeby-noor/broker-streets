const listingService = require('../../services/listing.service');
const uploadService = require('../../services/upload.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { HTTP_STATUS } = require('../../utils/constants');

const getAdminProperties = asyncHandler(async (req, res) => {
  const result = await listingService.getListings(req.query, true);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      result.data,
      'Admin property listings retrieved successfully',
      result.meta
    )
  );
});

const getAdminPropertyById = asyncHandler(async (req, res) => {
  const listing = await listingService.getListingById(req.params.id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, listing, 'Property details retrieved successfully')
  );
});

const createAdminProperty = asyncHandler(async (req, res) => {
  const processedFiles = await uploadService.processListingFiles(req.files);
  const listingData = { ...req.body, ...processedFiles };

  const listing = await listingService.createListing(listingData, req.user);
  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, listing, 'Property created successfully via admin')
  );
});

const updateAdminProperty = asyncHandler(async (req, res) => {
  const processedFiles = await uploadService.processListingFiles(req.files);
  const listingData = { ...req.body, ...processedFiles };

  const updated = await listingService.updateListing(req.params.id, listingData, req.user);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated, 'Property updated successfully via admin')
  );
});

const updateAdminPropertyStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = await listingService.updateListingStatus(req.params.id, status, req.user);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated, 'Property status updated successfully')
  );
});

const toggleAdminPropertyFeatured = asyncHandler(async (req, res) => {
  const { featured } = req.body;
  const updated = await listingService.toggleFeatured(req.params.id, featured);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated, 'Property featured status updated')
  );
});

const toggleAdminPropertyVerified = asyncHandler(async (req, res) => {
  const { verified } = req.body;
  const updated = await listingService.toggleVerified(req.params.id, verified);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated, 'Property verified status updated')
  );
});

const deleteAdminProperty = asyncHandler(async (req, res) => {
  await listingService.deleteListing(req.params.id, req.user);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

const bulkDeleteAdminProperties = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await listingService.bulkDeleteListings(ids);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

const exportAdminProperties = asyncHandler(async (req, res) => {
  await listingService.exportListingsCsv(req.query, res);
});

module.exports = {
  getAdminProperties,
  getAdminPropertyById,
  createAdminProperty,
  updateAdminProperty,
  updateAdminPropertyStatus,
  toggleAdminPropertyFeatured,
  toggleAdminPropertyVerified,
  deleteAdminProperty,
  bulkDeleteAdminProperties,
  exportAdminProperties,
};
