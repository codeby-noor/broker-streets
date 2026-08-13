// Item 5: RecentlyViewed Service
const RecentlyViewed = require('../models/RecentlyViewed');
const Listing = require('../models/Listing');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

class RecentlyViewedService {
  /**
   * Get max 20 recently viewed items for current user, newest first
   */
  async getRecentlyViewed(userId) {
    const records = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(20)
      .populate('listingId');

    const formattedRecords = records
      .filter((record) => record.listingId != null)
      .map((record) => {
        const listingDoc = record.listingId.toObject
          ? record.listingId.toObject()
          : { ...record.listingId };
        listingDoc.id = listingDoc._id.toString();
        delete listingDoc._id;
        delete listingDoc.__v;

        return {
          listing: listingDoc,
          viewedAt: record.viewedAt,
        };
      });

    return formattedRecords;
  }

  /**
   * Upsert listing view timestamp and prune overflow records (>20)
   */
  async recordView(userId, listingId) {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Listing not found');
    }

    const updatedRecord = await RecentlyViewed.findOneAndUpdate(
      { userId, listingId },
      { viewedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Enforce max 20 records limit per user
    const userRecords = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .select('_id');

    if (userRecords.length > 20) {
      const overflowIds = userRecords.slice(20).map((doc) => doc._id);
      await RecentlyViewed.deleteMany({ _id: { $in: overflowIds } });
    }

    return updatedRecord;
  }

  /**
   * Remove listing from recently viewed history
   */
  async removeRecentlyViewed(userId, listingId) {
    const record = await RecentlyViewed.findOneAndDelete({ userId, listingId });
    if (!record) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Recently viewed record not found');
    }
    return true;
  }
}

module.exports = new RecentlyViewedService();
