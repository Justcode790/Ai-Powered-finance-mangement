const express = require('express');
const {
  getArticles,
  getArticleById,
  getTips,
  getModules,
  getModuleById,
  updateModuleProgress,
  getUserProgress,
  searchContent,
  getRecommendations,
  getContextualTip,
  markTipAsHelpful
} = require('../controllers/educationController');

const router = express.Router();

// Article routes
router.get('/articles', getArticles);
router.get('/articles/:id', getArticleById);

// Tip routes
router.get('/tips', getTips);
router.get('/tips/contextual', getContextualTip);
router.post('/tips/:id/helpful', markTipAsHelpful);

// Module routes
router.get('/modules', getModules);
router.get('/modules/:id', getModuleById);
router.post('/modules/:id/progress', updateModuleProgress);

// Progress routes
router.get('/progress', getUserProgress);

// Search route
router.get('/search', searchContent);

// Recommendations route
router.get('/recommendations', getRecommendations);

module.exports = router;
