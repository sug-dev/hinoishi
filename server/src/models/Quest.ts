
import mongoose from 'mongoose';

const completionSchema = new mongoose.Schema({
  completedAt: {
    type: Date,
    default: Date.now
  },
  xpEarned: {
    type: Number,
    required: true,
    min: 0
  },
  awardedStatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stat',
    required: true
  }
}, { _id: true });

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
  description: {
    type: String,
    default: ''
  },
  statId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stat'
  },
  xp: {
    type: Number,
    default: 10,
    min: 0
  },

  // Whether this quest can be completed more than once.
  repeatable: {
    type: Boolean,
    default: false
  },

  // Individual completion records for repeatable quests.
  completionHistory: {
    type: [completionSchema],
    default: []
  },

  // Existing fields retained for non-repeatable quests.
  completedAt: {
    type: Date
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  awardedStatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stat'
  },
  active: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const Quest = mongoose.model('Quest', schema);
