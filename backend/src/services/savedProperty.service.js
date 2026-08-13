// Item 4: SavedProperty Service
const SavedProperty = require('../models/SavedProperty');
const Listing = require('../models/Listing');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

class SavedPropertyService {
  /**
   * Get all saved properties for current user with populated listing details
   */
  async getSavedProperties(userId) {
    const savedRecords = await SavedProperty.find({ userId })
      .sort({ savedAt: -1 })
      .populate('listingId');

    // Filter out records where underlying listing was deleted
    const validListings = savedRecords
      .filter((record) => record.listingId != null)
      .map((record) => {
        const listingDoc = record.listingId.toObject
          ? record.listingId.toObject()
          : { ...record.listingId };
        listingDoc.id = listingDoc._id.toString();
        delete listingDoc._id;
        delete listingDoc.__v;
        return listingDoc;
      });

    return validListings;
  }

  /**
   * Toggle save/unsave listing for current user
   */
  async toggleSaveProperty(userId, listingId) {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Listing not found');
    }

    const existingSave = await SavedProperty.findOne({ userId, listingId });

    if (existingSave) {
      await SavedProperty.deleteOne({ _id: existingSave._id });
      return { saved: false, listingId };
    }

    const savedProperty = new SavedProperty({
      userId,
      listingId,
      savedAt: new Date(),
    });

    const savedDoc = await savedProperty.save();
    return { saved: true, data: savedDoc };
  }

  /**
   * Remove saved property bookmark for current user
   */
  async removeSavedProperty(userId, listingId) {
    const record = await SavedProperty.findOneAndDelete({ userId, listingId });
    if (!record) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Saved property bookmark not found');
    }
    return true;
  }

  /**
   * Check if listing is saved by current user
   */
  async checkIsSaved(userId, listingId) {
    const record = await SavedProperty.findOne({ userId, listingId });
    return { saved: !!record };
  }
}

module.exports = new SavedPropertyService();
