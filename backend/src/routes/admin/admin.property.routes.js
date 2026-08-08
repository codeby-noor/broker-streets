const express = require('express');
const adminPropertyController = require('../../controllers/admin/admin.property.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');
const validate = require('../../middleware/validate.middleware');
const { uploadListingFiles } = require('../../middleware/upload.middleware');
const {
  createListingSchema,
  adminUpdateListingSchema,
  queryListingSchema,
  updateStatusSchema,
  adminUpdateFeaturedSchema,
  adminUpdateVerifiedSchema,
  adminBulkDeleteSchema,
  idParamSchema,
} = require('../../validators/listing.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(adminMiddleware);

router.get('/', validate({ query: queryListingSchema }), adminPropertyController.getAdminProperties);
router.get('/export', adminPropertyController.exportAdminProperties);
router.get('/:id', validate({ params: idParamSchema }), adminPropertyController.getAdminPropertyById);
router.post('/', uploadListingFiles, validate({ body: createListingSchema }), adminPropertyController.createAdminProperty);
router.put(
  '/:id',
  validate({ params: idParamSchema }),
  uploadListingFiles,
  validate({ body: adminUpdateListingSchema }),
  adminPropertyController.updateAdminProperty
);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateStatusSchema }),
  adminPropertyController.updateAdminPropertyStatus
);
router.patch(
  '/:id/featured',
  validate({ params: idParamSchema, body: adminUpdateFeaturedSchema }),
  adminPropertyController.toggleAdminPropertyFeatured
);
router.patch(
  '/:id/verified',
  validate({ params: idParamSchema, body: adminUpdateVerifiedSchema }),
  adminPropertyController.toggleAdminPropertyVerified
);
router.delete('/:id', validate({ params: idParamSchema }), adminPropertyController.deleteAdminProperty);
router.delete('/', validate({ body: adminBulkDeleteSchema }), adminPropertyController.bulkDeleteAdminProperties);

module.exports = router;
