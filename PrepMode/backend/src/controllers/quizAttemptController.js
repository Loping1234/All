const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const { learnerQuestion, reviewQuestion, attemptSummary } = require('../utils/serializers');
const { badRequest, notFound } = require('../utils/httpError');
const { EXAM_MODES } = require('../utils/enums');

/** Start an attempt: returns stripped questions only (no answer keys). */
async function startAttempt(req, res, next) {
  try {
    const { questionIds, examMode } = req.body || {};
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      throw badRequest('questionIds must be a non-empty array');
    }
    if (questionIds.length > 50) throw badRequest('A quiz cannot exceed 50 questions');
    const mode = EXAM_MODES.includes(examMode) ? examMode : 'All';

    const uniqueIds = [...new Set(questionIds.map(String))];
    const questions = await QuizQuestion.find({ _id: { $in: uniqueIds }, status: 'published' });
    if (questions.length === 0) throw badRequest('No published questions match the requested ids');

    const orderedQuestions = uniqueIds
      .map((id) => questions.find((q) => String(q._id) === id))
      .filter(Boolean);

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      examMode: mode,
      questionIds: orderedQuestions.map((q) => q._id),
      totalQuestions: orderedQuestions.length,
      status: 'in_progress',
      startedAt: new Date(),
    });

    res.status(201).json({
      attemptId: String(attempt._id),
      status: attempt.status,
      examMode: attempt.examMode,
      totalQuestions: attempt.totalQuestions,
      startedAt: attempt.startedAt,
      questions: orderedQuestions.map(learnerQuestion),
    });
  } catch (err) {
    next(err);
  }
}

/** Submit: grades server-side, then (and only then) returns the answer key. */
async function submitAttempt(req, res, next) {
  try {
    const attempt = await QuizAttempt.findOne({ _id: req.params.id, user: req.user._id });
    if (!attempt) throw notFound('Attempt not found');
    if (attempt.status !== 'in_progress') throw badRequest('This attempt has already been submitted', 'ALREADY_SUBMITTED');

    const { answers } = req.body || {};
    if (!Array.isArray(answers)) throw badRequest('answers must be an array');

    const answerMap = new Map();
    for (const entry of answers) {
      if (entry && entry.questionId) {
        answerMap.set(String(entry.questionId), entry.selectedAnswer == null ? null : String(entry.selectedAnswer));
      }
    }

    const questions = await QuizQuestion.find({ _id: { $in: attempt.questionIds } });
    const questionById = new Map(questions.map((q) => [String(q._id), q]));

    let correct = 0;
    const storedAnswers = [];
    const review = [];
    for (const qid of attempt.questionIds.map(String)) {
      const question = questionById.get(qid);
      if (!question) continue;
      const selected = answerMap.has(qid) ? answerMap.get(qid) : null;
      if (selected !== null && selected === question.correctAnswer) correct += 1;
      storedAnswers.push({ questionId: question._id, selectedAnswer: selected });
      review.push(reviewQuestion(question, selected));
    }

    attempt.answers = storedAnswers;
    attempt.correctAnswers = correct;
    attempt.score = correct;
    attempt.accuracy = attempt.totalQuestions
      ? Math.round((correct / attempt.totalQuestions) * 10000) / 100
      : 0;
    attempt.status = 'completed';
    attempt.completedAt = new Date();
    await attempt.save();

    res.json({ ...attemptSummary(attempt), attemptId: String(attempt._id), review });
  } catch (err) {
    next(err);
  }
}

async function listAttempts(req, res, next) {
  try {
    const filter = { user: req.user._id };
    if (req.query.status && ['in_progress', 'completed', 'abandoned'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.examMode && EXAM_MODES.includes(req.query.examMode) && req.query.examMode !== 'All') {
      filter.examMode = req.query.examMode;
    }
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10) || 20));
    const attempts = await QuizAttempt.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json({ attempts: attempts.map(attemptSummary) });
  } catch (err) {
    next(err);
  }
}

/** Attempt detail: review fields appear only after completion. */
async function getAttempt(req, res, next) {
  try {
    const attempt = await QuizAttempt.findOne({ _id: req.params.id, user: req.user._id });
    if (!attempt) throw notFound('Attempt not found');

    const base = { ...attemptSummary(attempt), attemptId: String(attempt._id) };
    if (attempt.status !== 'completed') {
      return res.json(base);
    }

    const questions = await QuizQuestion.find({ _id: { $in: attempt.questionIds } });
    const questionById = new Map(questions.map((q) => [String(q._id), q]));
    const selectedByQid = new Map(attempt.answers.map((a) => [String(a.questionId), a.selectedAnswer]));

    const review = attempt.questionIds
      .map(String)
      .map((qid) => {
        const question = questionById.get(qid);
        return question ? reviewQuestion(question, selectedByQid.has(qid) ? selectedByQid.get(qid) : null) : null;
      })
      .filter(Boolean);

    res.json({ ...base, review });
  } catch (err) {
    next(err);
  }
}

module.exports = { startAttempt, submitAttempt, listAttempts, getAttempt };
