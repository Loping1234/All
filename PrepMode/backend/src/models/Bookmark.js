const mongoose = require('mongoose');
const { EXAM_MODES } = require('../utils/enums');

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', required: true },
    examModeAtSave: { type: String, enum: EXAM_MODES, default: 'All' },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, content: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
