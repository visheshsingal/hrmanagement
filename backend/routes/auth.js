const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorizeHR } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new employee (public) or HR (HR only)
// @access  Public for employees, Private for HR
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['hr', 'employee']).withMessage('Role must be either hr or employee')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Only allow employee registration publicly
    // HR registration should be done through the HR portal
    if (role === 'hr') {
      return res.status(403).json({ 
        message: 'HR registration is restricted. Please contact your administrator.' 
      });
    }

    // Create new employee
    user = new User({
      name,
      email,
      password,
      role: 'employee' // Force role to employee for public registration
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register/hr
// @desc    Register a new HR user (HR only)
// @access  Private (HR)
router.post('/register/hr', [
  auth,
  authorizeHR,
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new HR user
    user = new User({
      name,
      email,
      password,
      role: 'hr'
    });

    await user.save();

    res.status(201).json({
      message: 'HR user created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('HR Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Hardcoded HR credentials (not stored in database)
    const HR_CREDENTIALS = {
      email: 'siddhibansal0808@gmail.com',
      password: 'siddhibansal',
      name: 'HR Administrator',
      role: 'hr'
    };

    // Check if it's HR login
    if (email === HR_CREDENTIALS.email && password === HR_CREDENTIALS.password) {
      // Generate token for HR (using a special HR user ID)
      const token = generateToken('hr-admin-user');
      
      res.json({
        token,
        user: {
          id: 'hr-admin-user',
          name: HR_CREDENTIALS.name,
          email: HR_CREDENTIALS.email,
          role: HR_CREDENTIALS.role,
          employeeId: null
        }
      });
      return;
    }

    // For all other users, check database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Handle HR admin user (not in database)
    if (req.user._id === 'hr-admin-user') {
      return res.json({
        _id: 'hr-admin-user',
        name: 'HR Administrator',
        email: 'siddhibansal0808@gmail.com',
        role: 'hr',
        employeeId: null
      });
    }
    
    // For regular users, get from database
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 