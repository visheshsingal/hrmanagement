const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, authorizeHR, authorizeEmployee } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/attendance
// @desc    Mark attendance (Employee only)
// @access  Private (Employee)
router.post('/', [
  auth,
  authorizeEmployee,
  body('type').isIn(['full-day', 'half-day', 'holiday']).withMessage('Invalid attendance type'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance already marked for today
    const existingAttendance = await Attendance.findOne({
      employee: req.user._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    // Check holiday limit if marking holiday
    if (type === 'holiday') {
      const holidayStatus = await Attendance.canTakeHoliday(req.user._id);
      if (!holidayStatus.canTake) {
        return res.status(400).json({ 
          message: `No holidays left for this month. You have used ${holidayStatus.currentCount}/${holidayStatus.maxHolidays} holidays.`,
          holidayStatus
        });
      }
    }

    // Create attendance record
    const attendance = new Attendance({
      employee: req.user._id,
      type,
      notes,
      checkIn: new Date(),
      status: type === 'half-day' ? 'half-day' : 'present'
    });

    await attendance.save();

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance: {
        id: attendance._id,
        type: attendance.type,
        checkIn: attendance.checkIn,
        status: attendance.status,
        notes: attendance.notes
      }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/holiday-status
// @desc    Get holiday status for current month (Employee only)
// @access  Private (Employee)
router.get('/holiday-status', auth, authorizeEmployee, async (req, res) => {
  try {
    const holidayStatus = await Attendance.canTakeHoliday(req.user._id);
    res.json(holidayStatus);
  } catch (error) {
    console.error('Get holiday status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/attendance/:id/checkout
// @desc    Check out (Employee only)
// @access  Private (Employee)
router.put('/:id/checkout', auth, authorizeEmployee, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (attendance.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this attendance' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out' });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.json({
      message: 'Check out successful',
      attendance: {
        id: attendance._id,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        workHours: attendance.calculateWorkHours()
      }
    });
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/my
// @desc    Get current user's attendance history (Employee only)
// @access  Private (Employee)
router.get('/my', auth, authorizeEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    
    const query = { employee: req.user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance
// @desc    Get all attendance records (HR only)
// @access  Private (HR)
router.get('/', auth, authorizeHR, async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, startDate, endDate, type } = req.query;
    
    const query = {};
    
    if (employeeId) {
      const employee = await User.findOne({ employeeId });
      if (employee) {
        query.employee = employee._id;
      }
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (type) {
      query.type = type;
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'name email employeeId department')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/employee/:employeeId
// @desc    Get attendance for specific employee (HR only)
// @access  Private (HR)
router.get('/employee/:employeeId', auth, authorizeHR, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    
    const employee = await User.findOne({ employeeId: req.params.employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const query = { employee: employee._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'name email employeeId department')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        department: employee.department
      },
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (HR only)
// @access  Private (HR)
router.put('/:id', [
  auth,
  authorizeHR,
  body('type').optional().isIn(['full-day', 'half-day', 'holiday']).withMessage('Invalid attendance type'),
  body('status').optional().isIn(['present', 'absent', 'late', 'half-day']).withMessage('Invalid status'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, status, notes } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (type) attendance.type = type;
    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;

    await attendance.save();

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 