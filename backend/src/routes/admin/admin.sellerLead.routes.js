const express = require('express');
const adminSellerLeadController = require('../../controllers/admin/admin.sellerLead.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  querySellerLeadSchema,
  updateStatusSchema,
  idParamSchema,
} = require('../../validators/sellerLead.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(adminMiddleware);

router.get('/', validate({ query: querySellerLeadSchema }), adminSellerLeadController.getAdminSellerLeads);
router.get('/:id', validate({ params: idParamSchema }), adminSellerLeadController.getAdminSellerLeadById);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateStatusSchema }),
  adminSellerLeadController.updateAdminSellerLeadStatus
);
router.delete('/:id', validate({ params: idParamSchema }), adminSellerLeadController.deleteAdminSellerLead);

module.exports = router;
