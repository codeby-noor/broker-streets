// Item 5: RecentlyViewed Model
const mongoose = require('mongoose');

const recentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required'],
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

recentlyViewedSchema.index({ userId: 1, viewedAt: -1 });
recentlyViewedSchema.index({ userId: 1, listingId: 1 }, { unique: true });

recentlyViewedSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema);

module.exports = RecentlyViewed;
