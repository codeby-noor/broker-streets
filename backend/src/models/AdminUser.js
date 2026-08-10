const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const adminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    name: {
      type: String,
      default: 'Admin',
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
    lastLogin: {
      type: Date,
      default: null,
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
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

/**
 * Bootstrap default admin user if no admin accounts exist
 */
adminUserSchema.statics.bootstrapDefaultAdmin = async function () {
  try {
    const count = await this.countDocuments();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash(env.adminDefaultPassword, 10);
      await this.create({
        email: env.adminDefaultEmail.toLowerCase(),
        password: hashedPassword,
        name: 'System Admin',
        role: 'superadmin',
        isActive: true,
      });
      console.log(`[AdminUser] Bootstrapped default admin account (${env.adminDefaultEmail})`);
    }
  } catch (err) {
    console.error('[AdminUser] Error bootstrapping default admin account:', err.message);
  }
};

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

module.exports = AdminUser;
