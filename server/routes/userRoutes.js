const express = require('express');
const { getMe, updateMe } = require('../controllers/userController');

const router = express.Router();

router.get('/me', getMe);
router.put('/me', updateMe);

module.exports = router;

