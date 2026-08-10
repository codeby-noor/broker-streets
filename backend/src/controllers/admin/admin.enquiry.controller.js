const enquiryService = require('../../services/enquiry.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { HTTP_STATUS } = require('../../utils/constants');

const getAdminEnquiries = asyncHandler(async (req, res) => {
  const result = await enquiryService.getEnquiries(req.query);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result.data, 'Enquiries retrieved successfully', result.meta)
  );
});

const getAdminEnquiryById = asyncHandler(async (req, res) => {
  const enquiry = await enquiryService.getEnquiryById(req.params.id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, enquiry, 'Enquiry details retrieved successfully')
  );
});

const updateAdminEnquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = await enquiryService.updateEnquiryStatus(req.params.id, status);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated, 'Enquiry status updated successfully')
  );
});

const deleteAdminEnquiry = asyncHandler(async (req, res) => {
  await enquiryService.deleteEnquiry(req.params.id);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

module.exports = {
  getAdminEnquiries,
  getAdminEnquiryById,
  updateAdminEnquiryStatus,
  deleteAdminEnquiry,
};
