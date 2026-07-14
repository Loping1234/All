const ContentCompletion = require('../models/ContentCompletion');
const QuizAttempt = require('../models/QuizAttempt');
const Bookmark = require('../models/Bookmark');
const SavedQuestion = require('../models/SavedQuestion');
const ContentItem = require('../models/ContentItem');
const { contentListItem, attemptSummary } = require('../utils/serializers');
const { notFound, badRequest } = require('../utils/httpError');
const { EXAM_MODES, CATEGORIES } = require('../utils/enums');

/** Aggregate counters and accuracy. No answer keys, no raw answers. */
async function summary(req, res, next) {
  try {
    const userId = req.user._id;
    const [completions, attempts, bookmarkCount, savedQuestionCount] = await Promise.all([
      ContentCompletion.find({ user: userId }).populate('content', 'category'),
      QuizAttempt.find({ user: userId, status: 'completed' }),
      Bookmark.countDocuments({ user: userId }),
      SavedQuestion.countDocuments({ user: userId }),
    ]);

    const byCategory = {};
    for (const category of CATEGORIES) byCategory[category] = 0;
    for (const completion of completions) {
      const category = completion.content && completion.content.category;
      if (category && byCategory[category] !== undefined) byCategory[category] += 1;
    }

    const totalQuestionsAnswered = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    const totalCorrect = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);

    res.json({
      summary: {
        completedContent: completions.length,
        completedByCategory: byCategory,
        quizAttempts: attempts.length,
        totalQuestionsAnswered,
        correctAnswers: totalCorrect,
        overallAccuracy: totalQuestionsAnswered
          ? Math.round((totalCorrect / totalQuestionsAnswered) * 10000) / 100
          : 0,
        bookmarks: bookmarkCount,
        savedQuestions: savedQuestionCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Completion + attempt history. Content rows are summary cards only. */
async function history(req, res, next) {
  try {
    const userId = req.user._id;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10) || 20));

    const [completions, attempts] = await Promise.all([
      ContentCompletion.find({ user: userId }).sort({ completedAt: -1 }).limit(limit).populate('content'),
      QuizAttempt.find({ user: userId, status: 'completed' }).sort({ completedAt: -1 }).limit(limit),
    ]);

    res.json({
      completions: completions
        .filter((c) => c.content)
        .map((c) => ({
          id: String(c._id),
          completedAt: c.completedAt,
          examModeAtCompletion: c.examModeAtCompletion,
          content: contentListItem(c.content),
        })),
      attempts: attempts.map(attemptSummary),
    });
  } catch (err) {
    next(err);
  }
}

async function byMode(req, res, next) {
  try {
    const mode = req.params.examMode;
    if (!EXAM_MODES.includes(mode)) throw badRequest('Invalid exam mode');

    const userId = req.user._id;
    const attemptFilter = { user: userId, status: 'completed' };
    if (mode !== 'All') attemptFilter.examMode = mode;

    const completionFilter = { user: userId };
    if (mode !== 'All') completionFilter.examModeAtCompletion = mode;

    const [completions, attempts] = await Promise.all([
      ContentCompletion.countDocuments(completionFilter),
      QuizAttempt.find(attemptFilter),
    ]);

    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    const totalCorrect = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);

    res.json({
      mode,
      summary: {
        completedContent: completions,
        quizAttempts: attempts.length,
        totalQuestionsAnswered: totalQuestions,
        correctAnswers: totalCorrect,
        accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 10000) / 100 : 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Idempotent mark-complete. */
async function markComplete(req, res, next) {
  try {
    const content = await ContentItem.findById(req.params.contentId);
    if (!content || content.status !== 'published') throw notFound('Content not found');

    const completion = await ContentCompletion.findOneAndUpdate(
      { user: req.user._id, content: content._id },
      {
        $setOnInsert: {
          examModeAtCompletion: req.user.activeExamMode || 'All',
          completedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      completion: {
        id: String(completion._id),
        contentId: String(content._id),
        completedAt: completion.completedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function unmarkComplete(req, res, next) {
  try {
    await ContentCompletion.findOneAndDelete({ user: req.user._id, content: req.params.contentId });
    res.json({ message: 'Completion removed' });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, history, byMode, markComplete, unmarkComplete };
