import mongoose from 'mongoose';

const processStepSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  inputs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    default: 'custom',
    enum: ['custom', 'energy', 'manufacturing', 'construction', 'mining', 'recycling']
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  processSteps: [processStepSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Template = mongoose.model('Template', templateSchema);

export default Template;
