const listingService = require('../services/listing.service');
const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

const getListings = asyncHandler(async (req, res) => {
  const result = await listingService.getListings(req.query, false);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      result.data,
      'Listings retrieved successfully',
      result.meta
    )
  );
});

const getListingById = asyncHandler(async (req, res) => {
  const listing = await listingService.getListingById(req.params.id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, listing, 'Property details retrieved successfully')
  );
});

const createListing = asyncHandler(async (req, res) => {
  const processedFiles = await uploadService.processListingFiles(req.files);
  const listingData = { ...req.body, ...processedFiles };

  const newListing = await listingService.createListing(listingData, req.user);
  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, newListing, 'Listing created successfully')
  );
});

const updateListing = asyncHandler(async (req, res) => {
  const processedFiles = await uploadService.processListingFiles(req.files);
  const listingData = { ...req.body, ...processedFiles };

  const updatedListing = await listingService.updateListing(req.params.id, listingData, req.user);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updatedListing, 'Listing updated successfully')
  );
});

const updateListingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updatedListing = await listingService.updateListingStatus(req.params.id, status, req.user);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updatedListing, 'Listing status updated successfully')
  );
});

const deleteListing = asyncHandler(async (req, res) => {
  await listingService.deleteListing(req.params.id, req.user);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

const duplicateListing = asyncHandler(async (req, res) => {
  const duplicatedListing = await listingService.duplicateListing(req.params.id, req.user);
  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, duplicatedListing, 'Listing duplicated successfully')
  );
});

const getSimilarListings = asyncHandler(async (req, res) => {
  const similarListings = await listingService.getSimilarListings(req.params.id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, similarListings, 'Similar listings retrieved successfully')
  );
});

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  updateListingStatus,
  deleteListing,
  duplicateListing,
  getSimilarListings,
};
