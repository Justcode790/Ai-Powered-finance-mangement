const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { getContextualTip, hasTipInSession } = require('../services/tipService');

const router = express.Router();

// POST /api/transactions
// Requires authMiddleware; uses req.userId from JWT
router.post('/', async (req, res) => {
  try {
    const { category, amount, date, type, description } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!category || !amount || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const transaction = new Transaction({
      userId: new mongoose.Types.ObjectId(req.userId),
      type: type || 'expense',
      category,
      amount,
      date,
      description: description || ''
    });

    const saved = await transaction.save();

    // Get contextual tip for this transaction (only if not shown in session and is expense)
    let tip = null;
    if (type !== 'income') {
      const hasRecentTip = await hasTipInSession(req.userId, 'transaction');
      
      if (!hasRecentTip) {
        tip = await getContextualTip(req.userId, 'transaction', category);
      }
    }

    res.status(201).json({
      transaction: saved,
      tip: tip || undefined
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/transactions
// Returns transactions for the authenticated user
router.get('/', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

