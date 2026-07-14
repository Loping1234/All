const SavedQuestion = require('../models/SavedQuestion');
const QuizQuestion = require('../models/QuizQuestion');
const { learnerQuestion } = require('../utils/serializers');
const { badRequest, notFound } = require('../utils/httpError');

/** Own saved questions; list payload NEVER includes the answer key. */
async function listSavedQuestions(req, res, next) {
  try {
    const saved = await SavedQuestion.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('question');
    res.json({
      savedQuestions: saved
        .filter((s) => s.question && s.question.status === 'published')
        .map((s) => ({
          id: String(s._id),
          reason: s.reason,
          examModeAtSave: s.examModeAtSave,
          savedAt: s.createdAt,
          question: learnerQuestion(s.question),
        })),
    });
  } catch (err) {
    next(err);
  }
}

async function createSavedQuestion(req, res, next) {
  try {
    const { questionId, reason } = req.body || {};
    if (!questionId) throw badRequest('questionId is required');

    const question = await QuizQuestion.findById(questionId);
    if (!question || question.status !== 'published') throw notFound('Question not found');

    const saved = await SavedQuestion.create({
      user: req.user._id,
      question: question._id,
      examModeAtSave: req.user.activeExamMode || 'All',
      reason: typeof reason === 'string' ? reason.slice(0, 300) : '',
    });

    res.status(201).json({
      savedQuestion: {
        id: String(saved._id),
        reason: saved.reason,
        examModeAtSave: saved.examModeAtSave,
        savedAt: saved.createdAt,
        question: learnerQuestion(question),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteSavedQuestion(req, res, next) {
  try {
    const deleted = await SavedQuestion.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) throw notFound('Saved question not found');
    res.json({ message: 'Saved question removed' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSavedQuestions, createSavedQuestion, deleteSavedQuestion };
