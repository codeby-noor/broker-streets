// Item 4: SavedProperty Model
const mongoose = require('mongoose');

const savedPropertySchema = new mongoose.Schema(
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
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Enforce unique save record per user per listing
savedPropertySchema.index({ userId: 1, listingId: 1 }, { unique: true });

savedPropertySchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const SavedProperty = mongoose.model('SavedProperty', savedPropertySchema);

module.exports = SavedProperty;
