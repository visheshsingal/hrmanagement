const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['full-day', 'half-day', 'holiday'],
    required: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present'
  }
}, {
  timestamps: true
});

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Method to calculate work hours
attendanceSchema.methods.calculateWorkHours = function() {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    const diffHrs = diffMs / (1000 * 60 * 60);
    return Math.round(diffHrs * 100) / 100;
  }
  return 0;
};

// Static method to get holiday count for a month
attendanceSchema.statics.getHolidayCountForMonth = async function(employeeId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const holidayCount = await this.countDocuments({
    employee: employeeId,
    type: 'holiday',
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });
  
  return holidayCount;
};

// Static method to check if employee can take holiday
attendanceSchema.statics.canTakeHoliday = async function(employeeId) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const holidayCount = await this.getHolidayCountForMonth(employeeId, currentYear, currentMonth);
  const maxHolidays = 2; // Maximum 2 holidays per month
  
  return {
    canTake: holidayCount < maxHolidays,
    currentCount: holidayCount,
    maxHolidays: maxHolidays,
    remaining: maxHolidays - holidayCount
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema); 