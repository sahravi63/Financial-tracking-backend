const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); // Adjust path if needed

router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

module.exports = router;
