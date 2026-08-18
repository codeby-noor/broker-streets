const { Webhook } = require('svix');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const handleClerkWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = env.clerkWebhookSecret || process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'CLERK_WEBHOOK_SECRET is not configured');
  }

  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Missing Svix verification headers');
  }

  const payload = req.body;
  const bodyString = typeof payload === 'string'
    ? payload
    : Buffer.isBuffer(payload)
    ? payload.toString('utf8')
    : JSON.stringify(payload);

  let evt;
  try {
    const wh = new Webhook(webhookSecret);
    evt = wh.verify(bodyString, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Webhook verification failed: ${err.message}`);
  }

  const { type, data } = evt;

  if (type === 'user.created') {
    const clerkUserId = data.id;
    const primaryEmailObj = data.email_addresses?.find(
      (e) => e.id === data.primary_email_address_id
    ) || data.email_addresses?.[0];
    const email = primaryEmailObj?.email_address || '';
    const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();

    await User.findOneAndUpdate(
      { clerkUserId },
      {
        $setOnInsert: {
          clerkUserId,
          name: name || 'User',
          email,
          phoneNumber: '',
          mobile: '',
          city: '',
          state: 'Gujarat',
          district: '',
          subDistrict: '',
          address: '',
          profileImage: data.image_url || '',
          role: 'user',
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else if (type === 'user.updated') {
    const clerkUserId = data.id;
    const primaryEmailObj = data.email_addresses?.find(
      (e) => e.id === data.primary_email_address_id
    ) || data.email_addresses?.[0];
    const email = primaryEmailObj?.email_address || '';
    const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();

    const updateFields = {};
    if (email) updateFields.email = email;
    if (name) updateFields.name = name;
    if (data.image_url) updateFields.profileImage = data.image_url;

    await User.findOneAndUpdate(
      { clerkUserId },
      { $set: updateFields },
      { new: true }
    );
  } else if (type === 'user.deleted') {
    const clerkUserId = data.id;
    await User.findOneAndUpdate({ clerkUserId }, { isActive: false });
  }

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { received: true }, 'Webhook processed successfully')
  );
});

module.exports = {
  handleClerkWebhook,
};
