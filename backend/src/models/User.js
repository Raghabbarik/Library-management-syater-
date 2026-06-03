const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'librarian'],
    default: 'student',
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
  },
  department: { type: String, trim: true },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  qrCode: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  membershipExpiry: { type: Date },
  totalBooksIssued: { type: Number, default: 0 },
  currentlyBorrowed: { type: Number, default: 0 },
  totalFinesPaid: { type: Number, default: 0 },
  pendingFines: { type: Number, default: 0 },
  lastLogin: { type: Date },
  refreshToken: { type: String, select: false },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
