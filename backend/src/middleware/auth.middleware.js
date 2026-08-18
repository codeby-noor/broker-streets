const { getAuth, requireAuth, clerkClient } = require('@clerk/express');
const User = require('../models/User');
const AdminUser = require('../models/AdminUser');
const { verifyAccessToken } = require('../services/jwt.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * resolveDbUser middleware:
 * Runs after Clerk authentication to bridge Clerk identity (req.auth().userId)
 * into the existing MongoDB User document attached to req.user.
 */
const resolveDbUser = asyncHandler(async (req, res, next) => {
  let clerkUserId;

  // 1. Extract Clerk userId from Clerk auth state (req.auth or getAuth(req))
  try {
    const auth = typeof req.auth === 'function' ? req.auth() : (req.auth || (getAuth ? getAuth(req) : null));
    if (auth && auth.userId) {
      clerkUserId = auth.userId;
    }
  } catch (err) {
    // getAuth failed or not a Clerk request
  }

  // 2. If Clerk userId found, resolve or create Mongo User document
  if (clerkUserId) {
    let user = await User.findOne({ clerkUserId });

    if (!user) {
      // First sight fallback: create Mongo User document if not created by webhook yet
      let email = '';
      let name = '';

      try {
        if (clerkClient && clerkClient.users && clerkClient.users.getUser) {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          if (clerkUser) {
            const primaryEmail = clerkUser.emailAddresses?.find(
              (e) => e.id === clerkUser.primaryEmailAddressId
            ) || clerkUser.emailAddresses?.[0];
            email = primaryEmail?.emailAddress || '';
            name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
          }
        }
      } catch (err) {
        // Fallback gracefully if Clerk API is offline or mocked
      }

      user = await User.create({
        clerkUserId,
        name: name || 'User',
        email: email || '',
        phoneNumber: '',
        mobile: '',
        city: '',
      });
    }

    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'User account is deactivated');
    }

    req.user = user;
    return next();
  }

  // 3. Fallback for Admin JWT auth (/api/admin/*) or direct mock/legacy token support
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyAccessToken(token);
      if (decoded && decoded.userId) {
        let user = await User.findById(decoded.userId);
        if (!user) {
          user = await AdminUser.findById(decoded.userId);
        }

        if (!user) {
          throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User no longer exists');
        }

        if (!user.isActive) {
          throw new ApiError(HTTP_STATUS.FORBIDDEN, 'User account is deactivated');
        }

        if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
          throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token has been revoked. Please sign in again.');
        }

        req.user = user;
        return next();
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
    }
  }

  throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
});

/**
 * Combined middleware for routes: runs requireAuth() followed by resolveDbUser
 */
const clerkAuth = (req, res, next) => {
  // If request has standard admin JWT token, bypass directly to resolveDbUser
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyAccessToken(token);
      if (decoded && decoded.userId) {
        return resolveDbUser(req, res, next);
      }
    } catch (e) {
      // Not an admin JWT, proceed to Clerk requireAuth
    }
  }

  // Execute Clerk requireAuth() then resolveDbUser
  requireAuth()(req, res, (err) => {
    if (err) return next(err);
    return resolveDbUser(req, res, next);
  });
};

module.exports = clerkAuth;
module.exports.resolveDbUser = resolveDbUser;
module.exports.requireAuth = requireAuth;
