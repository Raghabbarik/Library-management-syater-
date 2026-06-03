require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing seeded users
    await User.deleteMany({ email: { $in: ['admin@smartlib.com', 'student@smartlib.com'] } });
    console.log('Cleaned existing default users.');

    // Create Admin
    const admin = await User.create({
      name: 'Librarian Admin',
      email: 'admin@smartlib.com',
      password: 'adminpassword123',
      role: 'admin',
      phone: '+1 555 0199',
      isActive: true
    });
    console.log('Seeded Admin user.');

    // Create Student
    const student = await User.create({
      name: 'John Doe',
      email: 'student@smartlib.com',
      password: 'studentpassword123',
      role: 'student',
      studentId: 'STU001',
      department: 'Computer Science',
      phone: '+1 555 0100',
      isActive: true
    });
    console.log('Seeded Student user.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedUsers();
