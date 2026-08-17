const express = require('express');
const adminTeamController = require('../../controllers/admin/admin.team.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');
const superAdminMiddleware = require('../../middleware/superAdmin.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  createAdminUserSchema,
  updateAdminUserStatusSchema,
  idParamSchema,
} = require('../../validators/adminTeam.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(adminMiddleware);
router.use(superAdminMiddleware);

router.get('/', adminTeamController.getAdminTeam);
router.post('/', validate(createAdminUserSchema), adminTeamController.createAdminMember);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateAdminUserStatusSchema }),
  adminTeamController.updateAdminMemberStatus
);
router.delete('/:id', validate({ params: idParamSchema }), adminTeamController.deleteAdminMember);

module.exports = router;
