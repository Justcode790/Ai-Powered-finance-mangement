const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');

// GET /api/insights - Get combined ML insights
router.get('/', insightsController.getInsights);

// POST /api/insights/invalidate - Invalidate cache
router.post('/invalidate', insightsController.invalidateInsightsCache);

module.exports = router;
