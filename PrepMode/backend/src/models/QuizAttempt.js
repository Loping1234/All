const mongoose = require('mongoose');
const { EXAM_MODES, ATTEMPT_STATUSES } = require('../utils/enums');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion', required: true },
    selectedAnswer: { type: String, default: null },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examMode: { type: String, enum: EXAM_MODES, default: 'All' },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' }],
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    status: { type: String, enum: ATTEMPT_STATUSES, default: 'in_progress', required: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
