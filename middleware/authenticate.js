// middleware/authenticate.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

function authenticate(req, res, next) {
  const token = req.headers['authorization'];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: 'Invalid token' });
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = authenticate;
