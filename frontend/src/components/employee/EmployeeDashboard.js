import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MarkAttendance from './MarkAttendance';
import AttendanceHistory from './AttendanceHistory';

const EmployeeDashboard = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [holidayStatus, setHolidayStatus] = useState(null);

  useEffect(() => {
    checkTodayAttendance();
    fetchHolidayStatus();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(`/api/attendance/my?startDate=${today}&endDate=${today}`);
      
      if (res.data.attendance.length > 0) {
        setTodayAttendance(res.data.attendance[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking attendance:', error);
      setLoading(false);
    }
  };

  const fetchHolidayStatus = async () => {
    try {
      const res = await axios.get('/api/attendance/holiday-status');
      setHolidayStatus(res.data);
    } catch (error) {
      console.error('Error fetching holiday status:', error);
    }
  };

  const handleMarkAttendance = async (type, notes) => {
    try {
      const res = await axios.post('/api/attendance', { type, notes });
      setTodayAttendance(res.data.attendance);
      toast.success('Attendance marked successfully!');
      // Refresh holiday status if it was a holiday
      if (type === 'holiday') {
        await fetchHolidayStatus();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleCheckout = async () => {
    if (!todayAttendance) return;
    
    try {
      await axios.put(`/api/attendance/${todayAttendance.id}/checkout`);
      await checkTodayAttendance(); // Refresh data
      toast.success('Check out successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check out');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Employee Dashboard</h1>
      
      {/* Holiday Status Card */}
      {holidayStatus && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Monthly Holiday Status</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              backgroundColor: holidayStatus.canTake ? '#d1fae5' : '#fee2e2',
              color: holidayStatus.canTake ? '#065f46' : '#991b1b',
              fontWeight: 'bold'
            }}>
              {holidayStatus.currentCount}/{holidayStatus.maxHolidays} Holidays Used
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              backgroundColor: holidayStatus.canTake ? '#dbeafe' : '#fef3c7',
              color: holidayStatus.canTake ? '#1e40af' : '#92400e'
            }}>
              {holidayStatus.remaining} Remaining
            </div>
            {!holidayStatus.canTake && (
              <div style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontWeight: 'bold'
              }}>
                ⚠️ Holiday Limit Reached
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Today's Status */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Today's Status</h2>
        {todayAttendance ? (
          <div>
            <p><strong>Status:</strong> 
              <span className={`badge badge-${todayAttendance.status === 'present' ? 'success' : 'warning'}`}>
                {todayAttendance.status}
              </span>
            </p>
            <p><strong>Type:</strong> {todayAttendance.type}</p>
            <p><strong>Check In:</strong> {new Date(todayAttendance.checkIn).toLocaleTimeString()}</p>
            {todayAttendance.checkOut && (
              <p><strong>Check Out:</strong> {new Date(todayAttendance.checkOut).toLocaleTimeString()}</p>
            )}
            {todayAttendance.notes && <p><strong>Notes:</strong> {todayAttendance.notes}</p>}
            
            {!todayAttendance.checkOut && (
              <button 
                onClick={handleCheckout}
                className="btn btn-success"
                style={{ marginTop: '1rem' }}
              >
                Check Out
              </button>
            )}
          </div>
        ) : (
          <div>
            <p>No attendance marked for today.</p>
            <MarkAttendance onMarkAttendance={handleMarkAttendance} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <Link to="/employee" className="btn btn-primary">Dashboard</Link>
        <Link to="/employee/attendance" className="btn btn-secondary">Attendance History</Link>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={
          <div className="card">
            <h2>Welcome to Employee Portal</h2>
            <p>Mark your attendance and view your attendance history.</p>
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.375rem' }}>
              <h4>Quick Actions:</h4>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li>Mark your daily attendance (Full Day, Half Day, or Holiday)</li>
                <li>Check in and out for the day</li>
                <li>View your attendance history with filters</li>
                <li>Monitor your holiday usage for the month</li>
              </ul>
            </div>
          </div>
        } />
        <Route path="/attendance" element={<AttendanceHistory />} />
      </Routes>
    </div>
  );
};

export default EmployeeDashboard; 