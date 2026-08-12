const buyerLeadService = require('../services/buyerLead.service');
const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

const getBuyerLeads = asyncHandler(async (req, res) => {
  const result = await buyerLeadService.getBuyerLeads(req.query, req.user);
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

  const audioFile =
    req.files &&
    (req.files.voiceRecording?.[0] || req.files.audio?.[0]);

  if (audioFile) {
    const processedAudio = await uploadService.processFile(audioFile, 'audio');
    if (processedAudio) {
      leadData.voiceRecording = processedAudio.url;
    }
  }

  const newLead = await buyerLeadService.createBuyerLead(leadData, req.user);
  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, newLead, 'Buyer lead created successfully')
  );
});

const updateBuyerLead = asyncHandler(async (req, res) => {
  const leadData = { ...req.body };

  const audioFile =
    req.files &&
    (req.files.voiceRecording?.[0] || req.files.audio?.[0]);

  if (audioFile) {
    const processedAudio = await uploadService.processFile(audioFile, 'audio');
    if (processedAudio) {
      leadData.voiceRecording = processedAudio.url;
    }
  }

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
