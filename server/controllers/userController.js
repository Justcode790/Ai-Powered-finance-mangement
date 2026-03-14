const User = require('../models/User');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'name email age income bank_balance financial_literacy_score saving_habit_score createdAt'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('getMe failed:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { age, income, bank_balance, financial_literacy_score, saving_habit_score } = req.body;

    if (age !== undefined && Number(age) < 18) {
      return res.status(400).json({ message: 'Age must be at least 18' });
    }
    if (income !== undefined && Number(income) <= 0) {
      return res.status(400).json({ message: 'Income must be greater than 0' });
    }
    if (bank_balance !== undefined && Number(bank_balance) < 0) {
      return res.status(400).json({ message: 'Bank balance cannot be negative' });
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

    const updateData = { age, income, financial_literacy_score, saving_habit_score };
    if (bank_balance !== undefined) {
      updateData.bank_balance = bank_balance;
    }

    const updated = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select('name email age income bank_balance financial_literacy_score saving_habit_score createdAt');

    res.json(updated);
  } catch (err) {
    console.error('updateMe failed:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

