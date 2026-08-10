const express = require('express');
const enquiryController = require('../controllers/enquiry.controller');
const authenticateToken = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createEnquirySchema } = require('../validators/enquiry.validator');

const router = express.Router();

router.use(authenticateToken);

router.post('/', validate({ body: createEnquirySchema }), enquiryController.createEnquiry);

module.exports = router;
