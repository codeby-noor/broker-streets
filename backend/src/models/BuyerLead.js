const mongoose = require('mongoose');

const buyerLeadSchema = new mongoose.Schema(
  {
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
    taluka: {
      type: String,
      required: [true, 'Taluka is required'],
      trim: true,
    },
    preferredVillages: {
      type: [String],
      required: [true, 'Preferred villages are required'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: 'At least two preferred villages are required',
      },
      default: [],
    },
    propertyType: {
      type: String,
      required: [true, 'Property type is required'],
      enum: ['Agricultural Land', 'Non-Agricultural Land'],
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      enum: ['Investment', 'Project', 'Personal Farm', 'Other'],
    },
    requirements: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Requirements cannot exceed 2000 characters'],
    },
    voiceRecording: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['New', 'Hot', 'Contacted', 'Closed'],
      default: 'New',
    },
  },
  {
    timestamps: true,
  }
);

buyerLeadSchema.index({ district: 1 });
buyerLeadSchema.index({ createdAt: -1 });

buyerLeadSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const BuyerLead = mongoose.model('BuyerLead', buyerLeadSchema);

module.exports = BuyerLead;
