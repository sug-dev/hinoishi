
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: '⭐'
  },
  description: {
    type: String,
    default: ''
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  unlockedMilestones: [{
    id: {
      type: String,
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

schema.index({ userId: 1, name: 1 }, { unique: true });

export const Stat = mongoose.model('Stat', schema);
