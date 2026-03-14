const express = require('express');
const router = express.Router();
const piggyBankController = require('../controllers/piggyBankController');

router.post('/contribute', piggyBankController.contribute);
router.post('/withdraw', piggyBankController.withdraw);
router.get('/balance', piggyBankController.getBalance);
router.get('/history', piggyBankController.getHistory);
router.put('/goal', piggyBankController.updateGoal);
router.get('/auto-suggest', piggyBankController.getAutoSuggest);

module.exports = router;
