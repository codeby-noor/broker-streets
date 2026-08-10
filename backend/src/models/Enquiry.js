const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      index: true,
    },
    buyerName: {
      type: String,
      required: [true, 'Buyer name is required'],
      trim: true,
    },
    sellerName: {
      type: String,
      default: '',
      trim: true,
    },
    propertyTitle: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Replied', 'Closed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

enquirySchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = Enquiry;
