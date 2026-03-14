const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Prediction = require('../models/Prediction');

const router = express.Router();

// Shared demo user ID that matches the client DEMO_USER_ID
const DEMO_USER_ID_HEX = '000000000000000000000001';
const DEMO_USER_ID = new mongoose.Types.ObjectId(DEMO_USER_ID_HEX);

// POST /api/demo/seed
// Creates a demo user and sample transactions for quick testing
router.post('/seed', async (req, res) => {
  try {
    // Clean existing demo data
    await Promise.all([
      User.deleteOne({ _id: DEMO_USER_ID }),
      Transaction.deleteMany({ userId: DEMO_USER_ID }),
      Prediction.deleteMany({ userId: DEMO_USER_ID })
    ]);

    const demoUser = await User.create({
      _id: DEMO_USER_ID,
      name: 'Demo Student',
      email: 'demo@student.com',
      password: 'demo1234',
      age: 22,
      income: 40000,
      financial_literacy_score: 7,
      saving_habit_score: 8
    });

    const now = new Date();
    const mkDate = (offsetDays) => {
      const d = new Date(now);
      d.setDate(d.getDate() - offsetDays);
      return d;
    };

    const sampleTransactions = [
      {
        userId: DEMO_USER_ID,
        type: 'expense',
        category: 'food',
        amount: 5000,
        date: mkDate(1)
      },
      {
        userId: DEMO_USER_ID,
        type: 'expense',
        category: 'transport',
        amount: 2000,
        date: mkDate(3)
      },
      {
        userId: DEMO_USER_ID,
        type: 'expense',
        category: 'education',
        amount: 1000,
        date: mkDate(5)
      },
      {
        userId: DEMO_USER_ID,
        type: 'expense',
        category: 'shopping',
        amount: 2000,
        date: mkDate(7)
      },
      {
        userId: DEMO_USER_ID,
        type: 'expense',
        category: 'entertainment',
        amount: 3000,
        date: mkDate(2)
      },
      {
        userId: DEMO_USER_ID,
        type: 'expense',
        category: 'rent',
        amount: 8000,
        date: mkDate(10)
      },
      {
        userId: DEMO_USER_ID,
        type: 'expense',
        category: 'misc',
        amount: 1500,
        date: mkDate(6)
      }
    ];

    const createdTransactions = await Transaction.insertMany(sampleTransactions);

    res.json({
      message: 'Demo data seeded successfully',
      demoUserId: DEMO_USER_ID_HEX,
      user: {
        _id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email
      },
      transactionsCreated: createdTransactions.length
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    res.status(500).json({ message: 'Failed to seed demo data' });
  }
});

module.exports = router;

