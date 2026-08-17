const mongoose = require('mongoose');
const env = require('../config/env');

const adminUserSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
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

adminUserSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Bootstrap default superadmin user if no admin accounts exist
 */
adminUserSchema.statics.bootstrapDefaultSuperAdmin = async function () {
  try {
    const count = await this.countDocuments();
    if (count === 0) {
      const defaultMobile = env.adminDefaultMobile || '9876543210';
      const defaultName = env.adminDefaultName || 'Super Admin';
      await this.create({
        mobile: defaultMobile,
        name: defaultName,
        role: 'superadmin',
        isActive: true,
        addedBy: null,
        tokenVersion: 0,
      });
      console.log(`[AdminUser] Bootstrapped default superadmin account (${defaultMobile} - ${defaultName})`);
    }
  } catch (err) {
    console.error('[AdminUser] Error bootstrapping default superadmin account:', err.message);
  }
};

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

module.exports = AdminUser;
