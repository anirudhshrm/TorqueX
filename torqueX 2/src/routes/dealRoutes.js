const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Get active deals (public)
router.get('/active', dealController.getActiveDeals);

// Admin routes
router.get('/admin', requireAuth, requireAdmin, dealController.getDealsAdmin);
router.post('/', requireAuth, requireAdmin, dealController.createDeal);
router.post('/:id/update', requireAuth, requireAdmin, dealController.updateDeal);
router.post('/:id/delete', requireAuth, requireAdmin, dealController.deleteDeal);

module.exports = router;