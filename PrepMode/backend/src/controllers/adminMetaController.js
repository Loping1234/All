const User = require('../models/User');
const ContentItem = require('../models/ContentItem');
const QuizQuestion = require('../models/QuizQuestion');
const SourceItem = require('../models/SourceItem');
const QuizAttempt = require('../models/QuizAttempt');
const { safeUser, contentListItem } = require('../utils/serializers');
const { CATEGORIES } = require('../utils/enums');

/** Dashboard counters and recent publishing activity. */
async function overview(_req, res, next) {
  try {
    const [
      totalContent,
      publishedContent,
      draftContent,
      archivedContent,
      totalQuestions,
      publishedQuestions,
      sourceCounts,
      learnerCount,
      attemptCount,
      categoryCounts,
      recentContent,
    ] = await Promise.all([
      ContentItem.countDocuments({}),
      ContentItem.countDocuments({ status: 'published' }),
      ContentItem.countDocuments({ status: 'draft' }),
      ContentItem.countDocuments({ status: 'archived' }),
      QuizQuestion.countDocuments({}),
      QuizQuestion.countDocuments({ status: 'published' }),
      SourceItem.aggregate([{ $group: { _id: '$processingStatus', count: { $sum: 1 } } }]),
      User.countDocuments({ role: 'registered_learner' }),
      QuizAttempt.countDocuments({ status: 'completed' }),
      ContentItem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      ContentItem.find({}).sort({ updatedAt: -1 }).limit(8),
    ]);

    const sourceStatusCounts = { new: 0, selected: 0, ignored: 0 };
    for (const row of sourceCounts) sourceStatusCounts[row._id] = row.count;

    const byCategory = {};
    for (const category of CATEGORIES) byCategory[category] = 0;
    for (const row of categoryCounts) {
      if (byCategory[row._id] !== undefined) byCategory[row._id] = row.count;
    }

    res.json({
      overview: {
        content: { total: totalContent, published: publishedContent, draft: draftContent, archived: archivedContent },
        questions: { total: totalQuestions, published: publishedQuestions },
        sources: sourceStatusCounts,
        learners: learnerCount,
        completedAttempts: attemptCount,
        contentByCategory: byCategory,
        recentContent: recentContent.map((item) => contentListItem(item)),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '20', 10) || 20));
    const filter = {};
    if (req.query.role && ['admin', 'registered_learner'].includes(req.query.role)) filter.role = req.query.role;
    if (req.query.search) {
      const safe = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      User.countDocuments(filter),
    ]);

    res.json({
      users: users.map(safeUser),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
}

/** Tag usage across content and questions, for the Manage Tags screen. */
async function listTags(_req, res, next) {
  try {
    const [contentSubject, contentTopic, questionTopic] = await Promise.all([
      ContentItem.aggregate([
        { $unwind: '$subjectTags' },
        { $group: { _id: '$subjectTags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ContentItem.aggregate([
        { $unwind: '$topicTags' },
        { $group: { _id: '$topicTags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      QuizQuestion.aggregate([
        { $unwind: '$topicTags' },
        { $group: { _id: '$topicTags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const mapTag = (rows) => rows.map((r) => ({ tag: r._id, count: r.count }));
    res.json({
      tags: {
        contentSubjectTags: mapTag(contentSubject),
        contentTopicTags: mapTag(contentTopic),
        questionTopicTags: mapTag(questionTopic),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { overview, listUsers, listTags };
