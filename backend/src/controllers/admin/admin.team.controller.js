const AdminUser = require('../../models/AdminUser');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { HTTP_STATUS } = require('../../utils/constants');

const getAdminTeam = asyncHandler(async (req, res) => {
  const team = await AdminUser.find()
    .populate('addedBy', 'name mobile')
    .sort({ createdAt: -1 });

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, team, 'Admin team members retrieved successfully')
  );
});

const createAdminMember = asyncHandler(async (req, res) => {
  const { mobile, name, role = 'admin' } = req.body;
  const normalizedMobile = String(mobile || '').replace(/\D/g, '');

  const existing = await AdminUser.findOne({ mobile: normalizedMobile });
  if (existing) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'An admin account with this mobile number already exists'
    );
  }

  const member = await AdminUser.create({
    mobile: normalizedMobile,
    name: name.trim(),
    role: role || 'admin',
    isActive: true,
    addedBy: req.user._id,
    tokenVersion: 0,
  });

  await member.populate('addedBy', 'name mobile');

  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, member, 'Admin member added successfully')
  );
});

const updateAdminMemberStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const target = await AdminUser.findById(id);

  if (!target) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin member not found');
  }

  // Self-protection guard
  if (target._id.toString() === req.user._id.toString()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Super admin cannot deactivate own account');
  }

  const newStatus = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !target.isActive;

  // Last remaining active superadmin protection
  if (!newStatus && target.role === 'superadmin') {
    const activeSuperAdmins = await AdminUser.countDocuments({
      role: 'superadmin',
      isActive: true,
    });
    if (activeSuperAdmins <= 1) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot deactivate the last remaining active super admin'
      );
    }
  }

  target.isActive = newStatus;
  if (!newStatus) {
    target.tokenVersion += 1;
  }
  await target.save();
  await target.populate('addedBy', 'name mobile');

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, target, 'Admin member status updated successfully')
  );
});

const deleteAdminMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const target = await AdminUser.findById(id);

  if (!target) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin member not found');
  }

  // Self-protection guard
  if (target._id.toString() === req.user._id.toString()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Super admin cannot delete own account');
  }

  // Last remaining active superadmin protection
  if (target.role === 'superadmin') {
    const activeSuperAdmins = await AdminUser.countDocuments({
      role: 'superadmin',
      isActive: true,
    });
    if (activeSuperAdmins <= 1) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Cannot delete the last remaining active super admin'
      );
    }
  }

  await AdminUser.findByIdAndDelete(id);

  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

module.exports = {
  getAdminTeam,
  createAdminMember,
  updateAdminMemberStatus,
  deleteAdminMember,
};
