const express = require('express');
const {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  getBudgetVariance
} = require('../controllers/budgetController');
const {
  getTemplates,
  getTemplateById,
  createCustomTemplate,
  getUserCustomTemplates
} = require('../controllers/templateController');

const router = express.Router();

// Template routes (must come before /:id routes)
router.get('/templates/custom/user', getUserCustomTemplates);
router.post('/templates/custom', createCustomTemplate);
router.get('/templates/:id', getTemplateById);
router.get('/templates', getTemplates);

// Budget CRUD routes
router.post('/', createBudget);
router.get('/', getBudgets);
router.get('/:id/variance', getBudgetVariance); // Specific route before generic /:id
router.get('/:id', getBudgetById);
router.put('/:id', updateBudget);

module.exports = router;
