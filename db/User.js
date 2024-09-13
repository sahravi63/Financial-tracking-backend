const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Add password field
  profilePicture: { type: String }, // To store profile picture filename
  resetPasswordToken: { type: String }, // For password reset functionality
  resetPasswordExpiry: { type: Date }, // Expiry date for reset token
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;