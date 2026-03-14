const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

exports.signupUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      income,
      financial_literacy_score,
      saving_habit_score
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (age !== undefined && Number(age) < 18) {
      return res.status(400).json({ message: 'Age must be at least 18' });
    }
    if (income !== undefined && Number(income) <= 0) {
      return res.status(400).json({ message: 'Income must be greater than 0' });
    }
    if (
      financial_literacy_score !== undefined &&
      (Number(financial_literacy_score) < 1 || Number(financial_literacy_score) > 10)
    ) {
      return res.status(400).json({ message: 'Financial literacy score must be between 1 and 10' });
    }
    if (
      saving_habit_score !== undefined &&
      (Number(saving_habit_score) < 1 || Number(saving_habit_score) > 10)
    ) {
      return res.status(400).json({ message: 'Saving habit score must be between 1 and 10' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const user = new User({
      name,
      email,
      password,
      age,
      income,
      financial_literacy_score,
      saving_habit_score
    });
    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      token,
      userId: user._id.toString(),
      name: user.name
    });
  } catch (error) {
    console.error('Error in signupUser:', error);
    res.status(500).json({ message: 'Signup failed' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString());

    res.json({
      token,
      userId: user._id.toString(),
      name: user.name,
      age: user.age,
      income: user.income,
      financial_literacy_score: user.financial_literacy_score,
      saving_habit_score: user.saving_habit_score
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

