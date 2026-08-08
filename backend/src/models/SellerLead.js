const mongoose = require('mongoose');

const sellerLeadSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  userName: {
    type: String,
    default: '',
    trim: true,
  },
  userMobile: {
    type: String,
    default: '',
    trim: true,
  },
  userEmail: {
    type: String,
    default: '',
    trim: true,
  },
  state: {
    type: String,
    default: 'Gujarat',
    trim: true,
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
  },
  subDistrict: {
    type: String,
    default: '',
    trim: true,
  },
  village: {
    type: String,
    default: '',
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Property type is required'],
    trim: true,
  },
  priceUnit: {
    type: String,
    default: '',
    trim: true,
  },
  priceAmount: {
    type: mongoose.Schema.Types.Mixed,
    default: '',
  },
  mapLink: {
    type: String,
    default: '',
    trim: true,
  },
  additionalDetails: {
    type: String,
    default: '',
    trim: true,
  },
  propertyImages: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  propertyVideos: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  propertyDocument: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  status: {
    type: String,
    enum: ['New', 'Reviewed', 'Approved', 'Rejected'],
    default: 'New',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

sellerLeadSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const SellerLead = mongoose.model('SellerLead', sellerLeadSchema);

module.exports = SellerLead;
