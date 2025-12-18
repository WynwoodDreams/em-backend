const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, email, role, name, profile_photo FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is a dealer
const isDealer = (req, res, next) => {
  if (req.user.role !== 'dealer') {
    return res.status(403).json({ error: 'Access denied. Dealer only.' });
  }
  next();
};

// Check if user is a rider
const isRider = (req, res, next) => {
  if (req.user.role !== 'rider') {
    return res.status(403).json({ error: 'Access denied. Rider only.' });
  }
  next();
};

module.exports = { auth, isDealer, isRider };
