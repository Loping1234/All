const QuizQuestion = require('../models/QuizQuestion');
const { learnerQuestion } = require('../utils/serializers');
const { notFound } = require('../utils/httpError');
const { DIFFICULTIES, EXAM_MODES } = require('../utils/enums');

function buildPublishedQuestionQuery(query) {
  const filter = { status: 'published' };
  if (query.examMode && query.examMode !== 'All' && EXAM_MODES.includes(query.examMode)) {
    filter.examModeTags = { $in: [query.examMode, 'All'] };
  }
  if (query.difficulty && DIFFICULTIES.includes(query.difficulty)) filter.difficulty = query.difficulty;
  if (query.subject) filter.subjectTags = query.subject;
  if (query.topic) filter.topicTags = query.topic;
  return filter;
}

/** Learner question list: NEVER includes correctAnswer or explanation. */
async function listQuestions(req, res, next) {
  try {
    const filter = buildPublishedQuestionQuery(req.query);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10) || 20));
    const questions = await QuizQuestion.find(filter).sort({ createdAt: -1 }).limit(limit);
    const total = await QuizQuestion.countDocuments(filter);
    res.json({ questions: questions.map(learnerQuestion), meta: { total } });
  } catch (err) {
    next(err);
  }
}

async function getQuestion(req, res, next) {
  try {
    const question = await QuizQuestion.findById(req.params.id);
    if (!question || question.status !== 'published') throw notFound('Question not found');
    res.json({ question: learnerQuestion(question) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listQuestions, getQuestion, buildPublishedQuestionQuery };
