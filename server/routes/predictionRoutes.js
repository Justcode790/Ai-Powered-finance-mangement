const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Prediction = require('../models/Prediction');
const PredictionLog = require('../models/PredictionLog');
const { buildMonthlyFeaturesForUser } = require('../services/featureService');

const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
let hasWarnedMlDown = false;

function buildFallbackPrediction(income, totalExpenses) {
  // Fallback only returns predicted savings when ML service is down.
  return {
    predicted_savings: Number(Math.max(income - totalExpenses, 0).toFixed(2))
  };
}

// POST /api/predict
// Requires authMiddleware; uses req.userId from JWT
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { totals, totalExpenses, featureObject, featureArray } = await buildMonthlyFeaturesForUser(
      userId,
      startOfMonth,
      now
    );

    // Payload MUST match ML model features exactly (by name); the model itself consumes in order.
    const payload = featureObject;

    const buildAnalysis = (predictedValue) => {
      const income = Number(featureObject.income || 0);
      const predicted_savings = Number(predictedValue || 0);
      const total_expenses = totalExpenses;

      const savings_rate = income > 0 ? predicted_savings / income : 0;

      let financial_health_score = 20;
      let financial_health_status = 'Poor';
      if (savings_rate >= 0.4) {
        financial_health_score = 95;
        financial_health_status = 'Excellent';
      } else if (savings_rate >= 0.3) {
        financial_health_score = 85;
        financial_health_status = 'Good';
      } else if (savings_rate >= 0.2) {
        financial_health_score = 70;
        financial_health_status = 'Average';
      } else if (savings_rate >= 0.1) {
        financial_health_score = 50;
        financial_health_status = 'Weak';
      }

      // Determine top spending category
      let top_spending_category = 'N/A';
      let maxVal = 0;
      Object.entries(totals).forEach(([key, val]) => {
        if (val > maxVal) {
          maxVal = val;
          top_spending_category = key;
        }
      });

      // Build dynamic advice
      const adviceParts = [];
      if (income > 0) {
        if ((totals.entertainment || 0) > 0.15 * income) {
          adviceParts.push('Your entertainment spending is high. Consider reducing it.');
        }
        if ((totals.shopping || 0) > 0.15 * income) {
          adviceParts.push(
            'Shopping expenses are consuming a large portion of income. Try to limit non-essential purchases.'
          );
        }
      }
      if (savings_rate < 0.2) {
        adviceParts.push('You should aim to save at least 20% of your income.');
      } else if (savings_rate > 0.3) {
        adviceParts.push('Great job saving! Consider investing surplus savings.');
      }

      const advice =
        adviceParts.length > 0
          ? adviceParts.join(' ')
          : 'You are on a reasonable path. Keep tracking your expenses and review your budget monthly.';

      return {
        predicted_savings,
        income,
        total_expenses,
        savings_rate,
        financial_health_score,
        financial_health_status,
        top_spending_category,
        advice,
        expenses_by_category: totals,
        feature_order: [
          'age',
          'income',
          'rent',
          'food',
          'transport',
          'entertainment',
          'shopping',
          'education',
          'misc',
          'financial_literacy_score',
          'saving_habit_score'
        ],
        feature_array: featureArray
      };
    };

    try {
      const startTime = Date.now();
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, payload);
      const latencyMs = Date.now() - startTime;
      
      const predicted_savings = mlResponse.data?.predicted_savings;
      const confidence_interval = mlResponse.data?.confidence_interval;
      const model_version = mlResponse.data?.model_version || 'unknown';

      const analysis = buildAnalysis(predicted_savings);
      
      // Add confidence interval to response
      if (confidence_interval) {
        analysis.confidence_interval = confidence_interval;
      }

      // Store minimal prediction record (existing schema)
      await Prediction.create({
        userId: new mongoose.Types.ObjectId(userId),
        predictedSavings: analysis.predicted_savings,
        financialHealthScore: analysis.financial_health_score,
        budgetStatus: analysis.financial_health_status,
        suggestedBudget: null
      });

      // Create PredictionLog record for ML monitoring
      try {
        await PredictionLog.create({
          userId: new mongoose.Types.ObjectId(userId),
          modelVersion: model_version,
          inputFeatures: featureObject,
          predictedSavings: analysis.predicted_savings,
          confidenceInterval: confidence_interval || { lower: 0, upper: 0 },
          predictionDate: new Date(),
          latencyMs: latencyMs
        });
      } catch (logError) {
        console.error('Error logging prediction:', logError.message);
        // Don't fail the request if logging fails
      }

      return res.json(analysis);
    } catch (mlError) {
      const code = mlError.code || mlError?.cause?.code;
      if (code === 'ECONNREFUSED') {
        if (!hasWarnedMlDown) {
          hasWarnedMlDown = true;
          console.warn(
            'ML service not reachable, using fallback rule-based prediction instead of failing.'
          );
        }
        const { predicted_savings } = buildFallbackPrediction(featureObject.income, totalExpenses);
        const analysis = buildAnalysis(predicted_savings);
        return res.json(analysis);
      } else {
        console.error('Error calling ML service:', mlError.message || mlError);
        if (mlError.response) {
          console.error('ML service error response:', mlError.response.data);
        }
        return res.status(500).json({ message: 'Prediction service error' });
      }
    }

    // If ML service returns unexpected shape, we'll fail above. No-op here.
  } catch (error) {
    console.error('Error in /api/predict:', error.message || error);
    res.status(500).json({ message: 'Prediction service error' });
  }
});

module.exports = router;

