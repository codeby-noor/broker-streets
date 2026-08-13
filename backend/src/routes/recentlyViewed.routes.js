// Item 5: RecentlyViewed Routes
const express = require('express');
const recentlyViewedController = require('../controllers/recentlyViewed.controller');
const authenticateToken = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  recordViewSchema,
  listingIdParamSchema,
} = require('../validators/recentlyViewed.validator');

const router = express.Router();

router.use(authenticateToken);

router.get('/', recentlyViewedController.getRecentlyViewed);
router.post('/', validate({ body: recordViewSchema }), recentlyViewedController.recordView);
router.delete('/:listingId', validate({ params: listingIdParamSchema }), recentlyViewedController.removeRecentlyViewed);

module.exports = router;
