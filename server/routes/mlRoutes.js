const express = require('express');
const axios = require('axios');
const router = express.Router();

// ML service base URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Helper function to handle ML service requests
const proxyToMLService = async (endpoint, method, data, res) => {
  try {
    const response = await axios({
      method,
      url: `${ML_SERVICE_URL}${endpoint}`,
      data,
      timeout: 30000 // 30 second timeout
    });
    return res.json(response.data);
  } catch (error) {
    console.error(`ML service error (${endpoint}):`, error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        error: 'ML service unavailable',
        message: 'The ML service is currently unavailable. Please try again later.'
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({
      error: 'ML service error',
      message: 'An error occurred while processing your request.'
    });
  }
};

// POST /api/ml/predict/savings - Savings prediction with confidence intervals
router.post('/predict/savings', async (req, res) => {
  const { age, income, rent, food, transport, entertainment, shopping, education, misc, financial_literacy_score, saving_habit_score } = req.body;
  
  await proxyToMLService('/predict', 'POST', {
    age,
    income,
    rent,
    food,
    transport,
    entertainment,
    shopping,
    education,
    misc,
    financial_literacy_score,
    saving_habit_score
  }, res);
});

// POST /api/ml/analyze/spending - Spending pattern analysis
router.post('/analyze/spending', async (req, res) => {
  const { userId, transactions } = req.body;
  
  await proxyToMLService('/ml/analyze/spending', 'POST', {
    userId: userId || req.userId,
    transactions
  }, res);
});

// POST /api/ml/forecast/spending - Spending forecast
router.post('/forecast/spending', async (req, res) => {
  const { userId, transactions, goals, income } = req.body;
  
  await proxyToMLService('/ml/forecast/spending', 'POST', {
    userId: userId || req.userId,
    transactions,
    goals: goals || [],
    income
  }, res);
});

// POST /api/ml/recommend/budget - Budget recommendation (50/30/20 + ML)
router.post('/recommend/budget', async (req, res) => {
  const { userId, income, transactions, goals, financial_literacy_score, saving_habit_score } = req.body;
  
  await proxyToMLService('/ml/recommend/budget', 'POST', {
    userId: userId || req.userId,
    income,
    transactions,
    goals: goals || [],
    financial_literacy_score: financial_literacy_score || 5.0,
    saving_habit_score: saving_habit_score || 5.0
  }, res);
});

// POST /api/ml/recommend/budget-xgboost - XGBoost budget recommendation
router.post('/recommend/budget-xgboost', async (req, res) => {
  const { Income, Age, Dependents, Occupation, City_Tier, Rent, Loan_Repayment, Insurance, Desired_Savings_Percentage } = req.body;
  
  await proxyToMLService('/ml/recommend/budget-xgboost', 'POST', {
    Income,
    Age,
    Dependents,
    Occupation,
    City_Tier,
    Rent,
    Loan_Repayment,
    Insurance,
    Desired_Savings_Percentage
  }, res);
});

// POST /api/ml/detect/behavior-anomaly - Financial behavior anomaly detection
router.post('/detect/behavior-anomaly', async (req, res) => {
  const { tweet_content, topic_tags, likes, retweets, replies, sentiment_score, emotion, financial_behavior } = req.body;
  
  await proxyToMLService('/ml/detect/behavior-anomaly', 'POST', {
    tweet_content,
    topic_tags,
    likes,
    retweets,
    replies,
    sentiment_score,
    emotion,
    financial_behavior
  }, res);
});

// POST /api/ml/analyze/spending-anomaly - Spending transaction anomaly analysis
router.post('/analyze/spending-anomaly', async (req, res) => {
  const { date, amount, category } = req.body;
  
  await proxyToMLService('/ml/analyze/spending-anomaly', 'POST', {
    date,
    amount,
    category
  }, res);
});

// GET /api/ml/monitoring/metrics - ML model performance monitoring
router.get('/monitoring/metrics', async (req, res) => {
  await proxyToMLService('/ml/monitoring/metrics', 'GET', null, res);
});

// GET /api/ml/monitoring/forecast-accuracy - Forecast accuracy metrics
router.get('/monitoring/forecast-accuracy', async (req, res) => {
  await proxyToMLService('/ml/monitoring/forecast-accuracy', 'GET', null, res);
});

module.exports = router;
