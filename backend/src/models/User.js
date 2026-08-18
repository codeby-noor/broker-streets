const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    mobile: {
      type: String,
      default: '',
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    whatsapp: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    city: {
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
      default: '',
      trim: true,
    },
    subDistrict: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    buyerFormSubmitted: {
      type: Boolean,
      default: false,
    },
    sellerFormSubmitted: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', function (next) {
  if (this.phoneNumber && !this.mobile) {
    this.mobile = this.phoneNumber;
  } else if (this.mobile && !this.phoneNumber) {
    this.phoneNumber = this.mobile;
  }
  next();
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
