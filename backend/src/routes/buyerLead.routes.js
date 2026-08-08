const express = require('express');
const buyerLeadController = require('../controllers/buyerLead.controller');
const authenticateToken = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { uploadBuyerLeadFiles } = require('../middleware/upload.middleware');
const {
  createBuyerLeadSchema,
  updateBuyerLeadSchema,
  queryBuyerLeadSchema,
  idParamSchema,
} = require('../validators/buyerLead.validator');

const router = express.Router();

router.use(authenticateToken);

router.get('/', validate({ query: queryBuyerLeadSchema }), buyerLeadController.getBuyerLeads);
router.get('/me', buyerLeadController.getMyBuyerLeads);
router.get('/:id', validate({ params: idParamSchema }), buyerLeadController.getBuyerLeadById);
router.post(
  '/',
  uploadBuyerLeadFiles,
  validate({ body: createBuyerLeadSchema }),
  buyerLeadController.createBuyerLead
);
router.put(
  '/:id',
  validate({ params: idParamSchema }),
  uploadBuyerLeadFiles,
  validate({ body: updateBuyerLeadSchema }),
  buyerLeadController.updateBuyerLead
);
router.delete('/:id', validate({ params: idParamSchema }), buyerLeadController.deleteBuyerLead);

module.exports = router;
