const enquiryService = require('../services/enquiry.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

const createEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await enquiryService.createEnquiry(req.body, req.user);
  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, enquiry, 'Enquiry submitted successfully')
  );
});

module.exports = {
  createEnquiry,
};
