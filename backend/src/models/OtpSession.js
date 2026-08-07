const mongoose = require('mongoose');

const otpSessionSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    used: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    pendingUserData: {
      type: Object,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const OtpSession = mongoose.model('OtpSession', otpSessionSchema);

module.exports = OtpSession;
