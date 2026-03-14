const express = require('express');
const {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal
} = require('../controllers/goalController');

const router = express.Router();

router.post('/', createGoal);
router.get('/', getGoals);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
