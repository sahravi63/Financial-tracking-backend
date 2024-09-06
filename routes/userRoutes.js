// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../db/User');
const Expense = require('../db/Expense');

// Add a new user
router.post('/add-user', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = new User({ name, email });
    await user.save();
    res.status(201).json({ message: 'User added successfully!', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add an expense for a user
router.post('/add-expense', async (req, res) => {
  try {
    const { userId, description, amount } = req.body;
    const expense = new Expense({ description, amount });
    await expense.save();

    // Find user and add expense reference
    const user = await User.findById(userId);
    user.expenses.push(expense._id);
    await user.save();

    res.status(201).json({ message: 'Expense added successfully!', expense });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove a user
router.delete('/remove-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User removed successfully!' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
