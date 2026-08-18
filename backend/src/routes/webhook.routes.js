const express = require('express');
const { handleClerkWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

// Parse raw body for Svix signature verification
router.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  handleClerkWebhook
);

module.exports = router;
