const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true, // Remove any leading or trailing spaces
  },
  amount: {
    type: Number,
    required: true,
    min: 0, // Ensure amount is not negative
  },
  date: {
    type: Date,
    default: Date.now, // Default to current date
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  }
});

// Optional: Create an index on the date field for faster queries
expenseSchema.index({ date: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
