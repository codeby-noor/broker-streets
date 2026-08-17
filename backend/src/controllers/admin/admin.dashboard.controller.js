const Listing = require('../../models/Listing');
const BuyerLead = require('../../models/BuyerLead');
const SellerLead = require('../../models/SellerLead');
const Enquiry = require('../../models/Enquiry');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { HTTP_STATUS } = require('../../utils/constants');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalProperties,
    availableProperties,
    soldProperties,
    unavailableProperties,
    totalBuyers,
    totalSellers,
    totalEnquiries,
    registeredUsers,
  ] = await Promise.all([
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'Available' }),
    Listing.countDocuments({ status: 'Sold' }),
    Listing.countDocuments({ status: 'Unavailable' }),
    BuyerLead.countDocuments(),
    SellerLead.countDocuments(),
    Enquiry.countDocuments(),
    User.countDocuments(),
  ]);

  const stats = {
    totalProperties,
    availableProperties,
    soldProperties,
    unavailableProperties,
    totalBuyers,
    totalSellers,
    totalEnquiries,
    registeredUsers,
  };

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, stats, 'Admin dashboard stats retrieved successfully')
  );
});

module.exports = {
  getDashboardStats,
};
