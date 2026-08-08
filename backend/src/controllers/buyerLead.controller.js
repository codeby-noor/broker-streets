const buyerLeadService = require('../services/buyerLead.service');
const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

function parseUrlArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((item) => typeof item === 'string' && item.trim() !== '');
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string' && item.trim() !== '');
    } catch (e) {
      return [input.trim()];
    }
  }
  return [];
}

const getBuyerLeads = asyncHandler(async (req, res) => {
  const result = await buyerLeadService.getBuyerLeads(req.query, false);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      result.data,
      'Buyer leads retrieved successfully',
      result.meta
    )
  );
});

const getMyBuyerLeads = asyncHandler(async (req, res) => {
  const leads = await buyerLeadService.getMyBuyerLeads(req.user._id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, leads, 'My buyer leads retrieved successfully')
  );
});

const getBuyerLeadById = asyncHandler(async (req, res) => {
  const lead = await buyerLeadService.getBuyerLeadById(req.params.id, req.user);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, lead, 'Buyer lead details retrieved successfully')
  );
});

const createBuyerLead = asyncHandler(async (req, res) => {
  const leadData = { ...req.body };

  if (req.files && req.files.audio && req.files.audio[0]) {
    const processedAudio = await uploadService.processFile(req.files.audio[0], 'audio');
    if (processedAudio) {
      leadData.voiceRecording = processedAudio.url;
    }
  }

  let newlyUploadedImages = [];
  if (req.files && req.files.images && req.files.images.length > 0) {
    const processedImages = await uploadService.processFiles(req.files.images, 'requirements');
    newlyUploadedImages = processedImages.map((img) => img.url);
  }

  const keepImages = parseUrlArray(req.body.keepImages || req.body.images);
  if (newlyUploadedImages.length > 0 || keepImages.length > 0) {
    leadData.images = [...keepImages, ...newlyUploadedImages];
  }

  delete leadData.keepImages;

  const newLead = await buyerLeadService.createBuyerLead(leadData, req.user);
  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, newLead, 'Buyer lead created successfully')
  );
});

const updateBuyerLead = asyncHandler(async (req, res) => {
  const leadData = { ...req.body };

  if (req.files && req.files.audio && req.files.audio[0]) {
    const processedAudio = await uploadService.processFile(req.files.audio[0], 'audio');
    if (processedAudio) {
      leadData.voiceRecording = processedAudio.url;
    }
  }

  let newlyUploadedImages = [];
  if (req.files && req.files.images && req.files.images.length > 0) {
    const processedImages = await uploadService.processFiles(req.files.images, 'requirements');
    newlyUploadedImages = processedImages.map((img) => img.url);
  }

  const keepImages = parseUrlArray(req.body.keepImages || req.body.images);
  if (newlyUploadedImages.length > 0 || keepImages.length > 0) {
    leadData.images = [...keepImages, ...newlyUploadedImages];
  }

  delete leadData.keepImages;

  const updatedLead = await buyerLeadService.updateBuyerLead(req.params.id, leadData, req.user);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updatedLead, 'Buyer lead updated successfully')
  );
});

const deleteBuyerLead = asyncHandler(async (req, res) => {
  await buyerLeadService.deleteBuyerLead(req.params.id, req.user);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

module.exports = {
  getBuyerLeads,
  getMyBuyerLeads,
  getBuyerLeadById,
  createBuyerLead,
  updateBuyerLead,
  deleteBuyerLead,
};
