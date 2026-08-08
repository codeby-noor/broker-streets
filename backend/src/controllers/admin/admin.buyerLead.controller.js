const buyerLeadService = require('../../services/buyerLead.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { HTTP_STATUS } = require('../../utils/constants');

const getAdminBuyerLeads = asyncHandler(async (req, res) => {
  const result = await buyerLeadService.getBuyerLeads(req.query, true);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      result.data,
      'Admin buyer leads retrieved successfully',
      result.meta
    )
  );
});

const getAdminBuyerLeadById = asyncHandler(async (req, res) => {
  const lead = await buyerLeadService.getBuyerLeadById(req.params.id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, lead, 'Buyer lead details retrieved successfully')
  );
});

const updateAdminBuyerLeadStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = await buyerLeadService.updateBuyerLeadStatus(req.params.id, status);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated, 'Buyer lead status updated successfully')
  );
});

const deleteAdminBuyerLead = asyncHandler(async (req, res) => {
  await buyerLeadService.deleteBuyerLead(req.params.id, req.user);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

module.exports = {
  getAdminBuyerLeads,
  getAdminBuyerLeadById,
  updateAdminBuyerLeadStatus,
  deleteAdminBuyerLead,
};
