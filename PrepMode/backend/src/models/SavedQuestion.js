const mongoose = require('mongoose');
const { EXAM_MODES } = require('../utils/enums');

const savedQuestionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion', required: true },
    examModeAtSave: { type: String, enum: EXAM_MODES, default: 'All' },
    reason: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

savedQuestionSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('SavedQuestion', savedQuestionSchema);
