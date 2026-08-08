const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    url: { type: String, default: '' },
    type: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Property type is required'],
      enum: ['Agricultural Land', 'Non-Agricultural Land'],
    },
    propertyType: {
      type: String,
      enum: ['Agricultural Land', 'Non-Agricultural Land'],
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
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    priceAmount: {
      type: Number,
      default: 0,
      min: [0, 'Price amount cannot be negative'],
    },
    priceUnit: {
      type: String,
      default: '',
      enum: ['', 'Vigha', 'Sq.Yard (Var)', 'Sq.Ft'],
    },
    price: {
      type: String,
      default: '',
      trim: true,
    },
    landArea: {
      type: String,
      default: '',
      trim: true,
    },
    mapLink: {
      type: String,
      default: '',
      trim: true,
      match: [/^(https?:\/\/.+)?$/, 'Map link must be a valid HTTP or HTTPS URL'],
    },
    additionalDetails: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Additional details cannot exceed 2000 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    propertyDocument: {
      type: documentSchema,
      default: null,
    },
    status: {
      type: String,
      enum: ['Available', 'Pending', 'Sold'],
      default: 'Available',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner user ID is required'],
      index: true,
    },
    ownerName: {
      type: String,
      default: '',
      trim: true,
    },
    ownerMobile: {
      type: String,
      default: '',
      trim: true,
      select: false,
    },
    ownerEmail: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes specified in BACKEND_SPEC.md 7.3
listingSchema.index({ district: 1, type: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ createdAt: -1 });

// Pre-validate hook to populate aliases and computed fields before schema validation
listingSchema.pre('validate', function (next) {
  if (this.isNew || this.isModified('type')) {
    this.propertyType = this.type;
  }
  if (this.isNew || this.isModified('district')) {
    this.city = this.district;
    this.location = this.district;
  }
  if (this.isNew || this.isModified('additionalDetails')) {
    if (this.additionalDetails) {
      this.description = this.additionalDetails;
    }
  }
  if (
    this.isNew ||
    this.isModified('village') ||
    this.isModified('subDistrict') ||
    this.isModified('district') ||
    this.isModified('state')
  ) {
    const parts = [this.village, this.subDistrict, this.district, this.state].filter(Boolean);
    this.address = parts.join(', ');
  }
  if (
    this.isNew ||
    this.isModified('type') ||
    this.isModified('village') ||
    this.isModified('subDistrict') ||
    this.isModified('district')
  ) {
    const loc = this.village || this.subDistrict || this.district;
    this.title = `${this.type} in ${loc}`;
  }
  if (this.isNew || this.isModified('priceAmount') || this.isModified('priceUnit')) {
    if (this.priceAmount) {
      this.price = `₹${this.priceAmount.toLocaleString('en-IN')}${this.priceUnit ? ' per ' + this.priceUnit : ''}`;
    }
  }
  next();
});

listingSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
