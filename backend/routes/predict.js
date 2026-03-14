const express = require('express');
const axios = require('axios');

const router = express.Router();

const ML_URL = process.env.ML_URL || 'http://localhost:8000/predict';

// POST /api/predict-savings
router.post('/predict-savings', async (req, res) => {
  try {
    const payload = req.body;
    const mlRes = await axios.post(ML_URL, payload);
    res.json(mlRes.data);
  } catch (err) {
    console.error('Predict savings failed:', err.message || err);
    res.status(500).json({ message: 'Prediction failed' });
  }
});

module.exports = router;

