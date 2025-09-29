import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get user profile information
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get preferences from user or set defaults
    const preferences = user.preferences || {
      notifications: {
        emailAlerts: true,
        pushNotifications: false,
        weeklyReports: true,
        projectUpdates: true,
        teamNotifications: false
      },
      display: {
        theme: 'light',
        language: 'en',
        timezone: 'America/Los_Angeles',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: 'US'
      },
      privacy: {
        profileVisibility: 'team',
        activitySharing: true,
        dataSharing: false,
        twoFactorAuth: false
      }
    };

    // Format the user data for frontend
    const profileData = {
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ')[1] || '',
      email: user.email,
      phone: user.phone || '',
      location: user.location || '',
      department: user.department || '',
      position: user.role || '',
      joinDate: user.createdAt.toISOString().split('T')[0],
      bio: user.bio || '',
      avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      preferences: preferences
    };

    res.json({
      success: true,
      profileData
    });
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user profile',
      error: error.message
    });
  }
};

// Update user profile information
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, location, department, position, bio, preferences } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    user.name = `${firstName} ${lastName}`.trim();
    if (email && email !== user.email) {
      // Check if email is already in use
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
      user.email = email;
    }
    
    user.phone = phone || '';
    user.location = location || '';
    user.department = department || '';
    user.bio = bio || '';
    
    // Only update role if position is different and valid
    if (position && ['metallurgist', 'Guest', 'Auditor', 'admin'].includes(position)) {
      user.role = position;
    }

    // Update preferences if provided
    if (preferences) {
      user.preferences = preferences;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profileData: {
        firstName,
        lastName,
        email: user.email,
        phone,
        location,
        department,
        position: user.role,
        joinDate: user.createdAt.toISOString().split('T')[0],
        bio,
        avatar: `${firstName[0]}${lastName[0]}`.toUpperCase(),
        preferences
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
};

// Update user password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};

export default {
  getProfile,
  updateProfile,
  updatePassword
};
