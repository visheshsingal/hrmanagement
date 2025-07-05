const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createDefaultHR = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hr-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if default HR already exists
    const existingHR = await User.findOne({ email: 'siddhibansal0808@gmail.com' });
    if (existingHR) {
      console.log('Default HR account already exists');
      process.exit(0);
    }

    // Create default HR account
    const defaultHR = new User({
      name: 'HR Administrator',
      email: 'siddhibansal0808@gmail.com',
      password: 'siddhibansal', // This will be hashed by the pre-save middleware
      role: 'hr',
      employeeId: null // Explicitly set to null for HR
    });

    await defaultHR.save();
    console.log('Default HR account created successfully!');
    console.log('Email: siddhibansal0808@gmail.com');
    console.log('Password: siddhibansal');
    console.log('\n✅ HR account is ready to use!');

  } catch (error) {
    console.error('Error creating default HR account:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createDefaultHR(); 