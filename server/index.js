const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const transactionRoutes = require('./routes/transactionRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const demoRoutes = require('./routes/demoRoutes');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const userRoutes = require('./routes/userRoutes');
const educationRoutes = require('./routes/educationRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const goalRoutes = require('./routes/goalRoutes');
const mlRoutes = require('./routes/mlRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const piggyBankRoutes = require('./routes/piggyBankRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://justcode790:Ankit790@cluster0forproject1.iz7lot1.mongodb.net/finance';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

app.get('/', (req, res) => {
  res.json({ message: 'Smart Financial Assistant API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/predict', authMiddleware, predictionRoutes);
app.use('/api/education', authMiddleware, educationRoutes);
app.use('/api/budgets', authMiddleware, budgetRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/goals', authMiddleware, goalRoutes);
app.use('/api/ml', authMiddleware, mlRoutes);
app.use('/api/insights', authMiddleware, insightsRoutes);
app.use('/api/piggybank', authMiddleware, piggyBankRoutes);
app.use('/api/demo', demoRoutes);

// Migration endpoint to initialize piggyBank for existing users
app.post('/api/migrate/piggybank', authMiddleware, async (req, res) => {
  try {
    const User = require('./models/User');
    const result = await User.updateMany(
      { 'piggyBank': { $exists: false } },
      {
        $set: {
          piggyBank: {
            balance: 0,
            goal: 15000,
            streak: {
              count: 0,
              lastContributionMonth: null
            },
            badges: [],
            untouchedStatus: true,
            totalContributions: 0,
            totalWithdrawals: 0
          }
        }
      }
    );
    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

