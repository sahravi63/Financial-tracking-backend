const Expense = require('../db/Expense');

// Add a new expense
const addExpense = async (req, res) => {
  try {
    const { description, amount, userId } = req.body; // Assume userId is provided in the request body
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const expense = new Expense({
      description,
      amount,
      user: userId // Associate expense with the user from request body
    });
    await expense.save();
    res.status(201).json({ expense });
  } catch (error) {
    res.status(400).json({ error: 'Failed to add expense' });
  }
};

// Get all expenses (public or non-authenticated)
const getExpenses = async (req, res) => {
  try {
    // Example of fetching all expenses or applying some other logic
    const expenses = await Expense.find(); // Fetch all expenses
    res.status(200).json(expenses);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch expenses' });
  }
};

// Update an existing expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, userId } = req.body; // Assume userId is provided in the request body
    const expense = await Expense.findOneAndUpdate(
      { _id: id, user: userId }, // Check if expense belongs to the user
      { description, amount },
      { new: true }
    );
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(200).json(expense);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update expense' });
  }
};

// Delete an expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // Assume userId is provided in the request body
    const expense = await Expense.findOneAndDelete({ _id: id, user: userId }); // Check if expense belongs to the user
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete expense' });
  }
};

module.exports = { addExpense, getExpenses, updateExpense, deleteExpense };