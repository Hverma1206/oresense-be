import express from 'express';
import { TeamMember, Invitation } from '../models/teamModel.js';
import User from '../models/userModel.js'; // Make sure this imports correctly
import { auth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Get all team members
router.get('/members', auth, async (req, res) => {
  try {
    const members = await TeamMember.find()
      .populate('user', 'name email')
      .populate('addedBy', 'name');
    
    // Format response
    const formattedMembers = members.map(member => {
      const avatar = member.user.name ? member.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '';
      
      return {
        id: member._id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        status: member.status,
        lastActive: member.lastActive,
        projects: member.projects,
        avatar: avatar
      };
    });
    
    res.json(formattedMembers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending invitations
router.get('/invitations', auth, async (req, res) => {
  try {
    const invitations = await Invitation.find()
      .populate('invitedBy', 'name email');
    
    // Format response and check if invitations are expired
    const now = new Date();
    const formattedInvitations = invitations.map(invitation => {
      // Update status if expired
      let status = invitation.status;
      if (status === 'Pending' && invitation.expiresAt < now) {
        status = 'Expired';
      }
      
      return {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        invitedBy: invitation.invitedBy?.name || 'System',
        invitedDate: invitation.invitedDate.toISOString().split('T')[0],
        status: status
      };
    });
    
    res.json(formattedInvitations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Invite a new team member
router.post('/invite', auth, async (req, res) => {
  try {
    const { email, role, message } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({ email, status: 'Pending' });
    if (existingInvitation) {
      return res.status(400).json({ message: 'An invitation has already been sent to this email' });
    }
    
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create invitation
    const invitation = new Invitation({
      email,
      role,
      invitedBy: req.user.id,
      token,
      expiresAt
    });
    
    await invitation.save();
    
    // Here you would typically send an email with the invitation link
    // For now, we'll just return success
    
    res.status(201).json({ 
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        invitedBy: req.user.name,
        invitedDate: invitation.invitedDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend invitation
router.post('/invitation/:id/resend', auth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Generate a new token
    invitation.token = crypto.randomBytes(32).toString('hex');
    
    // Reset expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    invitation.expiresAt = expiresAt;
    
    // Update status if it was expired
    if (invitation.status === 'Expired') {
      invitation.status = 'Pending';
    }
    
    await invitation.save();
    
    // Here you would typically send a new email with the invitation link
    
    res.json({ 
      message: 'Invitation resent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        invitedDate: invitation.invitedDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel invitation
router.delete('/invitation/:id', auth, async (req, res) => {
  try {
    const invitation = await Invitation.findByIdAndDelete(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update team member role or status
router.put('/member/:id', auth, async (req, res) => {
  try {
    const { role, status } = req.body;
    
    const member = await TeamMember.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    if (role) member.role = role;
    if (status) member.status = status;
    
    await member.save();
    
    res.json({ 
      message: 'Team member updated successfully',
      member: {
        id: member._id,
        role: member.role,
        status: member.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove team member
router.delete('/member/:id', auth, async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
