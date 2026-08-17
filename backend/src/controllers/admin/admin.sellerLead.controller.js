const sellerLeadService = require('../../services/sellerLead.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { HTTP_STATUS } = require('../../utils/constants');

const getAdminSellerLeads = asyncHandler(async (req, res) => {
  const result = await sellerLeadService.getSellerLeads(req.query, req.user);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      result.data,
      'Admin seller leads retrieved successfully',
      result.meta
    )
  );
});

const getAdminSellerLeadById = asyncHandler(async (req, res) => {
  const lead = await sellerLeadService.getSellerLeadById(req.params.id, req.user);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, lead, 'Seller lead details retrieved successfully')
  );
});

const updateAdminSellerLeadStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = await sellerLeadService.updateSellerLeadStatus(req.params.id, status);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated, 'Seller lead status updated successfully')
  );
});

const deleteAdminSellerLead = asyncHandler(async (req, res) => {
  await sellerLeadService.deleteSellerLead(req.params.id, req.user);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

module.exports = {
  getAdminSellerLeads,
  getAdminSellerLeadById,
  updateAdminSellerLeadStatus,
  deleteAdminSellerLead,
};
