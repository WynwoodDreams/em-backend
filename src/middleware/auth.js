const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'User not authenticated' });
    
    // Check role (handles both directly on user object or nested in user.user)
    const userRole = req.user.role || (req.user.user && req.user.user.role);
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    next();
  };
};

module.exports = { auth, authorize };
