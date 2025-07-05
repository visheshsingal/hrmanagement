const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    
    // Handle special HR admin user (not in database)
    if (decoded.userId === 'hr-admin-user') {
      req.user = {
        _id: 'hr-admin-user',
        name: 'HR Administrator',
        email: 'siddhibansal0808@gmail.com',
        role: 'hr',
        employeeId: null
      };
      return next();
    }
    
    // For regular users, check database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorizeHR = async (req, res, next) => {
  if (req.user.role !== 'hr') {
    return res.status(403).json({ message: 'Access denied. HR role required.' });
  }
  next();
};

const authorizeEmployee = async (req, res, next) => {
  if (req.user.role !== 'employee') {
    return res.status(403).json({ message: 'Access denied. Employee role required.' });
  }
  next();
};

module.exports = { auth, authorizeHR, authorizeEmployee }; 