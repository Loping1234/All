const mongoose = require('mongoose');
const { DIFFICULTIES, QUESTION_STATUSES, EXAM_MODES } = require('../utils/enums');

const quizQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(opts) {
          return Array.isArray(opts) && opts.length >= 2 && opts.length <= 6 && new Set(opts).size === opts.length;
        },
        message: 'Options must contain 2-6 distinct entries',
      },
    },
    correctAnswer: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(this.options) && this.options.includes(value);
        },
        message: 'correctAnswer must exactly match one of the options',
      },
    },
    explanation: { type: String, required: true, trim: true },
    subjectTags: { type: [String], default: [] },
    topicTags: { type: [String], default: [] },
    examModeTags: { type: [String], enum: EXAM_MODES, default: ['All'] },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    status: { type: String, enum: QUESTION_STATUSES, default: 'draft', required: true },
    sourceContentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

quizQuestionSchema.index({ status: 1, examModeTags: 1, difficulty: 1 });

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
