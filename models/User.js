import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['metallurgist', 'Guest', 'Auditor', 'admin'],
    default: 'Guest'
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  preferences: {
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: false },
      weeklyReports: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: true },
      teamNotifications: { type: Boolean, default: false }
    },
    display: {
      theme: { type: String, default: 'light' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'America/Los_Angeles' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      numberFormat: { type: String, default: 'US' }
    },
    privacy: {
      profileVisibility: { type: String, default: 'team' },
      activitySharing: { type: Boolean, default: true },
      dataSharing: { type: Boolean, default: false },
      twoFactorAuth: { type: Boolean, default: false }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
