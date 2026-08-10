const Enquiry = require('../models/Enquiry');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { HTTP_STATUS } = require('../utils/constants');

class EnquiryService {
  /**
   * Create an enquiry from a buyer for a listing
   */
  async createEnquiry(data, user) {
    const Listing = require('../models/Listing');
    const listing = await Listing.findById(data.listingId);
    if (!listing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Listing not found');
    }

    if (listing.status && listing.status !== 'Available') {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot submit an enquiry for a listing that is not available'
      );
    }

    if (listing.userId && listing.userId.toString() === user._id.toString()) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'You cannot enquire about your own listing');
    }

    const enquiry = new Enquiry({
      buyerId: user._id,
      sellerId: listing.userId,
      listingId: listing._id,
      buyerName: user.name || '',
      sellerName: listing.ownerName || '',
      propertyTitle: listing.title || '',
      message: data.message,
      phone: data.phone || user.mobile || '',
      email: data.email || user.email || '',
    });

    const savedEnquiry = await enquiry.save();

    // Best-effort notification creation if Notification model is available
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: listing.userId,
        type: 'New enquiry',
        message: `${user.name || 'A buyer'} sent an enquiry about ${listing.title}.`,
        category: 'enquiry',
      });
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND' || (e.message && e.message.includes('Cannot find module'))) {
        // Notification model not implemented yet — ignore gracefully
      } else {
        console.error(`Failed to create notification for enquiry ${savedEnquiry._id}:`, e);
      }
    }

    return savedEnquiry;
  }

  /**
   * Get paginated enquiries for admin with filtering and search
   */
  async getEnquiries(queryParams = {}) {
    const {
      status,
      sort = 'newest',
      page = 1,
      limit = 10,
      search,
    } = queryParams;

    const matchStage = {};

    if (status) {
      matchStage.status = status;
    }

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: escapeRegex(search.trim()), $options: 'i' };
      matchStage.$or = [
        { buyerName: searchRegex },
        { sellerName: searchRegex },
        { propertyTitle: searchRegex },
        { message: searchRegex },
      ];
    }

    let sortStage = { createdAt: -1 };
    if (sort === 'oldest') sortStage = { createdAt: 1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    const aggregationResult = await Enquiry.aggregate([
      { $match: matchStage },
      {
        $facet: {
          data: [{ $sort: sortStage }, { $skip: skipNum }, { $limit: limitNum }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const facetResult = aggregationResult[0] || { data: [], totalCount: [] };
    const rawData = facetResult.data || [];
    const total = facetResult.totalCount[0] ? facetResult.totalCount[0].count : 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    const formattedData = rawData.map((item) => {
      const doc = {
        ...item,
        id: item._id.toString(),
      };
      delete doc._id;
      delete doc.__v;
      return doc;
    });

    return {
      data: formattedData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get single enquiry by ID
   */
  async getEnquiryById(id) {
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Enquiry not found');
    }
    return enquiry;
  }

  /**
   * Update enquiry status (Admin)
   */
  async updateEnquiryStatus(id, status) {
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Enquiry not found');
    }

    enquiry.status = status;
    await enquiry.save();
    return enquiry;
  }

  /**
   * Delete enquiry (Admin)
   */
  async deleteEnquiry(id) {
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Enquiry not found');
    }

    await Enquiry.findByIdAndDelete(id);
    return true;
  }
}

module.exports = new EnquiryService();
