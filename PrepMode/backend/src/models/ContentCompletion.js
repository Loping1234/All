const mongoose = require('mongoose');
const { EXAM_MODES } = require('../utils/enums');

const contentCompletionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', required: true },
    examModeAtCompletion: { type: String, enum: EXAM_MODES, default: 'All' },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

contentCompletionSchema.index({ user: 1, content: 1 }, { unique: true });

module.exports = mongoose.model('ContentCompletion', contentCompletionSchema);
