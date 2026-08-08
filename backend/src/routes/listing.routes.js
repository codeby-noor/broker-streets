const express = require('express');
const listingController = require('../controllers/listing.controller');
const authenticateToken = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { uploadListingFiles } = require('../middleware/upload.middleware');
const {
  createListingSchema,
  updateListingSchema,
  queryListingSchema,
  updateStatusSchema,
  idParamSchema,
} = require('../validators/listing.validator');

const router = express.Router();

// Apply auth middleware to all listing endpoints
router.use(authenticateToken);

router.get('/', validate({ query: queryListingSchema }), listingController.getListings);
router.get('/:id', validate({ params: idParamSchema }), listingController.getListingById);
router.post('/', uploadListingFiles, validate({ body: createListingSchema }), listingController.createListing);
router.put(
  '/:id',
  validate({ params: idParamSchema }),
  uploadListingFiles,
  validate({ body: updateListingSchema }),
  listingController.updateListing
);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateStatusSchema }),
  listingController.updateListingStatus
);
router.delete('/:id', validate({ params: idParamSchema }), listingController.deleteListing);
router.post('/:id/duplicate', validate({ params: idParamSchema }), listingController.duplicateListing);
router.get('/:id/similar', validate({ params: idParamSchema }), listingController.getSimilarListings);

module.exports = router;
