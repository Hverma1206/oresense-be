import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Analyst', 'Collaborator', 'Viewer'],
    default: 'Viewer'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invitedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Expired'],
    default: 'Pending'
  },
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Default expiration is 7 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  }
});

const teamMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Analyst', 'Collaborator', 'Viewer'],
    default: 'Viewer'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active'
  },
  projects: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
});

// Use mongoose.models to check if models already exist
const TeamMember = mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema);
const Invitation = mongoose.models.Invitation || mongoose.model('Invitation', invitationSchema);

export { TeamMember, Invitation };
