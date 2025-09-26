import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  metalType: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Making it optional to support anonymous reports
  },
  formData: {
    type: Object,
    required: true
  },
  insights: {
    lca_summary: String,
    recommendations: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'completed'
  }
});

// Virtual for calculating environmental impact score (could be implemented later)
reportSchema.virtual('environmentalImpactScore').get(function() {
  // Placeholder for future impact score calculation logic
  // This would be based on various factors in formData
  return 0;
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
