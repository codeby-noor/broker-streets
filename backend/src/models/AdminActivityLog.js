const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: [true, 'Admin ID is required'],
      index: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      required: [true, 'Role is required'],
    },
    type: {
      type: String,
      enum: ['login', 'logout'],
      required: [true, 'Activity type is required'],
      index: true,
    },
    status: {
      type: String,
      default: function () {
        return this.type === 'login' ? 'Login' : 'Logout';
      },
    },
    ip: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    sessionInfo: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

adminActivityLogSchema.index({ sessionId: 1, createdAt: -1 });
adminActivityLogSchema.index({ mobile: 1, createdAt: -1 });
adminActivityLogSchema.index({ createdAt: -1 });

adminActivityLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const AdminActivityLog = mongoose.model('AdminActivityLog', adminActivityLogSchema);

module.exports = AdminActivityLog;
