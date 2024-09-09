const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { addExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');

// Apply the authenticate middleware to routes that require authentication
router.post('/', authenticate, addExpense); // Add a new expense
router.get('/', authenticate, getExpenses); // Get all expenses for the authenticated user
router.put('/:id', authenticate, updateExpense); // Update an expense by ID
router.delete('/:id', authenticate, deleteExpense); // Delete an expense by ID

module.exports = router;
