const express = require('express');
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { uploadRateLimiter } = require('../middleware/rateLimiter.middleware');
const { uploadUserProfileImage } = require('../middleware/upload.middleware');
const { updateProfileSchema, completeProfileSchema } = require('../validators/user.validator');

const router = express.Router();

router.use(authenticateToken);

router.get('/me', userController.getMe);
router.patch('/me/profile', validate({ body: completeProfileSchema }), userController.completeProfile);
router.put('/me', validate({ body: updateProfileSchema }), userController.updateMe);
router.put('/me/profile-image', uploadRateLimiter, uploadUserProfileImage, userController.updateProfileImage);

module.exports = router;