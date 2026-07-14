const QuizQuestion = require('../models/QuizQuestion');
const { adminQuestion } = require('../utils/serializers');
const { badRequest, notFound } = require('../utils/httpError');
const { DIFFICULTIES, QUESTION_STATUSES, EXAM_MODES } = require('../utils/enums');

function sanitizeTags(value) {
  if (!Array.isArray(value)) return undefined;
  return value.map((t) => String(t).trim()).filter(Boolean).slice(0, 10);
}

function pickQuestionPayload(body) {
  const payload = {};
  if (body.questionText !== undefined) payload.questionText = String(body.questionText);
  if (body.options !== undefined) {
    if (!Array.isArray(body.options)) throw badRequest('options must be an array');
    payload.options = body.options.map((o) => String(o).trim()).filter(Boolean);
  }
  if (body.correctAnswer !== undefined) payload.correctAnswer = String(body.correctAnswer);
  if (body.explanation !== undefined) payload.explanation = String(body.explanation);
  if (body.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(body.difficulty)) throw badRequest('Invalid difficulty');
    payload.difficulty = body.difficulty;
  }
  for (const field of ['subjectTags', 'topicTags', 'examModeTags']) {
    if (body[field] !== undefined) {
      const tags = sanitizeTags(body[field]);
      if (tags) payload[field] = tags;
    }
  }
  if (payload.examModeTags) {
    payload.examModeTags = payload.examModeTags.filter((m) => EXAM_MODES.includes(m));
    if (!payload.examModeTags.length) payload.examModeTags = ['All'];
  }
  if (body.sourceContentId !== undefined) payload.sourceContentId = body.sourceContentId || null;
  return payload;
}

async function listAdminQuestions(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && QUESTION_STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (req.query.difficulty && DIFFICULTIES.includes(req.query.difficulty)) filter.difficulty = req.query.difficulty;
    if (req.query.examMode && req.query.examMode !== 'All' && EXAM_MODES.includes(req.query.examMode)) {
      filter.examModeTags = { $in: [req.query.examMode, 'All'] };
    }
    if (req.query.search) {
      const safe = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.questionText = { $regex: safe, $options: 'i' };
    }

    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '20', 10) || 20));

    const [questions, total] = await Promise.all([
      QuizQuestion.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      QuizQuestion.countDocuments(filter),
    ]);

    res.json({
      questions: questions.map(adminQuestion),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
}

async function createQuestion(req, res, next) {
  try {
    const payload = pickQuestionPayload(req.body || {});
    if (!payload.questionText) throw badRequest('Question text is required');
    if (!payload.options || payload.options.length < 2) throw badRequest('At least two options are required');
    if (!payload.correctAnswer) throw badRequest('correctAnswer is required');
    if (!payload.options.includes(payload.correctAnswer)) {
      throw badRequest('correctAnswer must exactly match one of the options');
    }
    if (!payload.explanation) throw badRequest('Explanation is required');
    if (!payload.difficulty) throw badRequest('Difficulty is required');

    const status = req.body.status === 'published' ? 'published' : 'draft';

    const question = await QuizQuestion.create({
      ...payload,
      status,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({ question: adminQuestion(question) });
  } catch (err) {
    next(err);
  }
}

async function updateQuestion(req, res, next) {
  try {
    const question = await QuizQuestion.findById(req.params.id);
    if (!question) throw notFound('Question not found');

    const payload = pickQuestionPayload(req.body || {});
    Object.assign(question, payload);
    if (!question.options.includes(question.correctAnswer)) {
      throw badRequest('correctAnswer must exactly match one of the options');
    }
    question.updatedBy = req.user._id;
    await question.save();

    res.json({ question: adminQuestion(question) });
  } catch (err) {
    next(err);
  }
}

function setStatus(status) {
  return async (req, res, next) => {
    try {
      const question = await QuizQuestion.findById(req.params.id);
      if (!question) throw notFound('Question not found');
      question.status = status;
      question.updatedBy = req.user._id;
      await question.save();
      res.json({ question: adminQuestion(question) });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  listAdminQuestions,
  createQuestion,
  updateQuestion,
  publishQuestion: setStatus('published'),
  archiveQuestion: setStatus('archived'),
};
