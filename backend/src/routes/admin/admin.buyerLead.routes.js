const express = require('express');
const adminBuyerLeadController = require('../../controllers/admin/admin.buyerLead.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  queryBuyerLeadSchema,
  updateStatusSchema,
  idParamSchema,
} = require('../../validators/buyerLead.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(adminMiddleware);

router.get('/', validate({ query: queryBuyerLeadSchema }), adminBuyerLeadController.getAdminBuyerLeads);
router.get('/:id', validate({ params: idParamSchema }), adminBuyerLeadController.getAdminBuyerLeadById);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateStatusSchema }),
  adminBuyerLeadController.updateAdminBuyerLeadStatus
);
router.delete('/:id', validate({ params: idParamSchema }), adminBuyerLeadController.deleteAdminBuyerLead);

module.exports = router;
