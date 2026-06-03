require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcrypt');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB connected');

    const user = await User.findOne({ email: 'admin@smartlib.com' }).select('+password');
    if (!user) {
      console.log('No user found with email admin@smartlib.com');
      process.exit(0);
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      passwordHash: user.password
    });

    const matches = await bcrypt.compare('adminpassword123', user.password);
    console.log('Password matches adminpassword123:', matches);

    const matchesDirect = await user.comparePassword('adminpassword123');
    console.log('Password matches via method:', matchesDirect);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
