// Item 4: SavedProperty Routes
const express = require('express');
const savedPropertyController = require('../controllers/savedProperty.controller');
const authenticateToken = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  toggleSaveSchema,
  listingIdParamSchema,
} = require('../validators/savedProperty.validator');

const router = express.Router();

router.use(authenticateToken);

router.get('/', savedPropertyController.getSavedProperties);
router.post('/', validate({ body: toggleSaveSchema }), savedPropertyController.toggleSaveProperty);
router.delete('/:listingId', validate({ params: listingIdParamSchema }), savedPropertyController.removeSavedProperty);
router.get('/:listingId/check', validate({ params: listingIdParamSchema }), savedPropertyController.checkSaved);

module.exports = router;
