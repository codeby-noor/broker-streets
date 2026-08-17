const express = require('express');
const adminUserController = require('../../controllers/admin/admin.user.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  queryAdminUsersSchema,
  updateUserStatusSchema,
  idParamSchema,
} = require('../../validators/adminUser.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(adminMiddleware);

router.get('/', validate({ query: queryAdminUsersSchema }), adminUserController.getAdminUsers);
router.get('/:id', validate({ params: idParamSchema }), adminUserController.getAdminUserById);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateUserStatusSchema }),
  adminUserController.updateAdminUserStatus
);

module.exports = router;
