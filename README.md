# HR Management System

A comprehensive MERN stack web application with separate portals for HR and Employee users.

## Features

### Employee Portal
- ✅ Login/Signup with role-based authentication
- ✅ Mark attendance (Full Day, Half Day, Holiday)
- ✅ View personal attendance history with date filters
- ✅ Check in/out functionality
- ✅ Real-time attendance status

### HR Portal
- ✅ Login/Signup with role-based authentication
- ✅ View all employee attendance records with advanced filtering
- ✅ Create and manage employee profiles
- ✅ Add/Edit employee details (name, email, role, department, etc.)
- ✅ Dashboard with key metrics
- ✅ Employee search and filtering
- ✅ Create additional HR accounts (HR only)

## Security Features

- **Restricted HR Registration**: Only existing HR users can create new HR accounts
- **Default HR Account**: Pre-configured admin account for initial setup
- **Role-based Access Control**: Strict separation between HR and Employee permissions
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt encryption for all passwords

## Tech Stack

- **Frontend**: React.js with React Router for navigation
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **UI**: Custom CSS with responsive design
- **State Management**: React Context API

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HRApp
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/hr-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system or update the MONGODB_URI to point to your MongoDB instance.

5. **Create Default HR Account**
   ```bash
   cd backend
   npm run setup
   ```
   This creates the default HR account:
   - **Email**: siddhibansal0808@gmail.com
   - **Password**: siddhibansal
   
   ✅ **HR account is ready to use!**

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

### Production Mode

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd backend
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new employee (public)
- `POST /api/auth/register/hr` - Register new HR user (HR only)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Employees (HR Only)
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `POST /api/attendance` - Mark attendance (Employee only)
- `PUT /api/attendance/:id/checkout` - Check out (Employee only)
- `GET /api/attendance/my` - Get user's attendance (Employee only)
- `GET /api/attendance` - Get all attendance (HR only)
- `GET /api/attendance/employee/:employeeId` - Get employee attendance (HR only)
- `PUT /api/attendance/:id` - Update attendance (HR only)

## Usage

### Getting Started

1. **Login as Default HR**
   - Go to `/login`
   - Use default credentials:
     - Email: `siddhibansal0808@gmail.com`
     - Password: `siddhibansal`
   - ✅ **HR account is ready to use!**

2. **Create Additional HR Accounts (Optional)**
   - Login as HR
   - Go to "Create HR Account" in the navigation
   - Create additional HR accounts for your team

3. **Employee Registration**
   - Employees can register publicly at `/register`
   - Only employee accounts can be created publicly
   - HR accounts are managed by existing HR users only

4. **HR Portal Features**
   - Add employees through the "Add Employee" form
   - View and manage employee list
   - Monitor attendance records
   - Filter and search functionality
   - Create additional HR accounts

5. **Employee Portal Features**
   - Mark daily attendance
   - View attendance history
   - Check in/out functionality

## Security Notes

- **HR Registration Restriction**: Public registration only allows employee accounts
- **HR Account Management**: Only existing HR users can create new HR accounts
- **Default Credentials**: Fixed HR credentials for system access
- **Role-based Access**: Strict separation between HR and Employee functionalities

## Project Structure

```
HRApp/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Attendance.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── employees.js
│   │   └── attendance.js
│   ├── scripts/
│   │   └── createDefaultHR.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   └── ProtectedRoute.js
│   │   │   ├── employee/
│   │   │   │   ├── EmployeeDashboard.js
│   │   │   │   ├── MarkAttendance.js
│   │   │   │   └── AttendanceHistory.js
│   │   │   ├── hr/
│   │   │   │   ├── HRDashboard.js
│   │   │   │   ├── EmployeeList.js
│   │   │   │   ├── EmployeeForm.js
│   │   │   │   ├── AttendanceView.js
│   │   │   │   └── CreateHR.js
│   │   │   └── layout/
│   │   │       ├── Navbar.js
│   │   │       └── Loading.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 