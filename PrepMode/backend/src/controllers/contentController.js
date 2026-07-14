const ContentItem = require('../models/ContentItem');
const Bookmark = require('../models/Bookmark');
const ContentCompletion = require('../models/ContentCompletion');
const { contentListItem, contentDetail } = require('../utils/serializers');
const { notFound } = require('../utils/httpError');
const { CATEGORIES, DIFFICULTIES, CONTENT_TYPES, RECENCY_TAGS, EXAM_MODES } = require('../utils/enums');

function buildPublishedQuery(query) {
  const filter = { status: 'published' };

  const category = query.category;
  if (category) {
    const list = String(category)
      .split(',')
      .map((c) => c.trim())
      .filter((c) => CATEGORIES.includes(c));
    if (list.length) filter.category = { $in: list };
  }
  if (query.examMode && query.examMode !== 'All' && EXAM_MODES.includes(query.examMode)) {
    filter.examModeTags = { $in: [query.examMode, 'All'] };
  }
  if (query.difficulty && DIFFICULTIES.includes(query.difficulty)) filter.difficulty = query.difficulty;
  if (query.contentType && CONTENT_TYPES.includes(query.contentType)) filter.contentType = query.contentType;
  if (query.recency && RECENCY_TAGS.includes(query.recency)) filter.recencyTag = query.recency;
  if (query.subject) filter.subjectTags = query.subject;
  if (query.topic) filter.topicTags = query.topic;
  if (query.search) {
    const safe = String(query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { summary: { $regex: safe, $options: 'i' } },
      { topicTags: { $regex: safe, $options: 'i' } },
    ];
  }
  return filter;
}

async function userFlags(userId, contentIds) {
  if (!userId) return { bookmarked: new Set(), completed: new Set(), bookmarkIdByContent: new Map() };
  const [bookmarks, completions] = await Promise.all([
    Bookmark.find({ user: userId, content: { $in: contentIds } }).select('content'),
    ContentCompletion.find({ user: userId, content: { $in: contentIds } }).select('content'),
  ]);
  return {
    bookmarked: new Set(bookmarks.map((b) => String(b.content))),
    completed: new Set(completions.map((c) => String(c.content))),
    bookmarkIdByContent: new Map(bookmarks.map((b) => [String(b.content), String(b._id)])),
  };
}

/** Learner/public list: published only, summary cards without body. */
async function listContent(req, res, next) {
  try {
    const filter = buildPublishedQuery(req.query);
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '20', 10) || 20));

    const [items, total] = await Promise.all([
      ContentItem.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      ContentItem.countDocuments(filter),
    ]);

    const flags = await userFlags(req.user && req.user._id, items.map((i) => i._id));
    res.json({
      items: items.map((item) =>
        contentListItem(item, {
          isBookmarked: flags.bookmarked.has(String(item._id)),
          isCompleted: flags.completed.has(String(item._id)),
          bookmarkId: flags.bookmarkIdByContent.get(String(item._id)) || null,
        })
      ),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
}

async function sendDetail(item, req, res) {
  if (!item || item.status !== 'published') throw notFound('Content not found');
  const flags = await userFlags(req.user && req.user._id, [item._id]);
  res.json({
    item: contentDetail(item, {
      isBookmarked: flags.bookmarked.has(String(item._id)),
      isCompleted: flags.completed.has(String(item._id)),
      bookmarkId: flags.bookmarkIdByContent.get(String(item._id)) || null,
    }),
  });
}

async function getContentById(req, res, next) {
  try {
    const item = await ContentItem.findById(req.params.id);
    await sendDetail(item, req, res);
  } catch (err) {
    next(err);
  }
}

async function getContentBySlug(req, res, next) {
  try {
    const item = await ContentItem.findOne({ slug: req.params.slug });
    await sendDetail(item, req, res);
  } catch (err) {
    next(err);
  }
}

module.exports = { listContent, getContentById, getContentBySlug };
