const jwt = require('jsonwebtoken');

// 1. Authentication Middleware (Verify Token)
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// 2. Authorization Middleware (Check Role)
// This is likely what shop.js was missing
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if user role matches allowed roles
    // Note: Adjust 'role' property name if your JWT uses a different key (e.g. req.user.user.role)
    const userRole = req.user.role || req.user.user?.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: `User role ${userRole} is not authorized to access this route`
      });
    }
    
    next();
  };
};

// Export both functions, plus aliases just in case
module.exports = { 
  auth, 
  protect: auth,    // Alias 'protect' to 'auth' in case some files use that name
  authorize 
};
