const express = require('express');
const adminEnquiryController = require('../../controllers/admin/admin.enquiry.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  queryEnquirySchema,
  updateStatusSchema,
  idParamSchema,
} = require('../../validators/enquiry.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(adminMiddleware);

router.get('/', validate({ query: queryEnquirySchema }), adminEnquiryController.getAdminEnquiries);
router.get('/:id', validate({ params: idParamSchema }), adminEnquiryController.getAdminEnquiryById);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateStatusSchema }),
  adminEnquiryController.updateAdminEnquiryStatus
);
router.delete('/:id', validate({ params: idParamSchema }), adminEnquiryController.deleteAdminEnquiry);

module.exports = router;
