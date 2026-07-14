const ContentItem = require('../models/ContentItem');
const { contentListItem, contentDetail } = require('../utils/serializers');
const { badRequest, notFound } = require('../utils/httpError');
const { slugify } = require('../utils/slugify');
const {
  CATEGORIES,
  DIFFICULTIES,
  CONTENT_TYPES,
  RECENCY_TAGS,
  READING_LEVELS,
  CONTENT_STATUSES,
  EXAM_MODES,
  SOURCE_TYPES,
} = require('../utils/enums');

const EDITABLE_FIELDS = [
  'title',
  'slug',
  'summary',
  'body',
  'category',
  'subjectTags',
  'topicTags',
  'examModeTags',
  'difficulty',
  'contentType',
  'recencyTag',
  'readingLevel',
];

function sanitizeTags(value) {
  if (!Array.isArray(value)) return undefined;
  return value.map((t) => String(t).trim()).filter(Boolean).slice(0, 10);
}

function pickContentPayload(body) {
  const payload = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] === undefined) continue;
    if (['subjectTags', 'topicTags', 'examModeTags'].includes(field)) {
      const tags = sanitizeTags(body[field]);
      if (tags) payload[field] = tags;
    } else {
      payload[field] = body[field];
    }
  }
  if (payload.examModeTags) {
    payload.examModeTags = payload.examModeTags.filter((m) => EXAM_MODES.includes(m));
    if (!payload.examModeTags.length) payload.examModeTags = ['All'];
  }
  if (body.sourceMetadata && typeof body.sourceMetadata === 'object') {
    const sm = body.sourceMetadata;
    payload.sourceMetadata = {
      sourceName: sm.sourceName ? String(sm.sourceName).slice(0, 120) : undefined,
      sourceType: SOURCE_TYPES.includes(sm.sourceType) ? sm.sourceType : undefined,
      sourceUrl: sm.sourceUrl ? String(sm.sourceUrl).slice(0, 500) : undefined,
      sourceDate: sm.sourceDate ? new Date(sm.sourceDate) : undefined,
    };
  }
  return payload;
}

async function listAdminContent(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && CONTENT_STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (req.query.category && CATEGORIES.includes(req.query.category)) filter.category = req.query.category;
    if (req.query.difficulty && DIFFICULTIES.includes(req.query.difficulty)) filter.difficulty = req.query.difficulty;
    if (req.query.contentType && CONTENT_TYPES.includes(req.query.contentType)) filter.contentType = req.query.contentType;
    if (req.query.examMode && req.query.examMode !== 'All' && EXAM_MODES.includes(req.query.examMode)) {
      filter.examModeTags = { $in: [req.query.examMode, 'All'] };
    }
    if (req.query.topic) filter.topicTags = req.query.topic;
    if (req.query.search) {
      const safe = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { summary: { $regex: safe, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '20', 10) || 20));

    const [items, total, counts] = await Promise.all([
      ContentItem.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      ContentItem.countDocuments(filter),
      ContentItem.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const statusCounts = { draft: 0, published: 0, archived: 0 };
    for (const row of counts) statusCounts[row._id] = row.count;

    res.json({
      items: items.map((item) => contentListItem(item)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), statusCounts },
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminContent(req, res, next) {
  try {
    const item = await ContentItem.findById(req.params.id);
    if (!item) throw notFound('Content not found');
    res.json({ item: contentDetail(item) });
  } catch (err) {
    next(err);
  }
}

async function createContent(req, res, next) {
  try {
    const payload = pickContentPayload(req.body || {});
    if (!payload.title) throw badRequest('Title is required');
    if (!payload.summary) throw badRequest('Summary is required');
    if (!payload.body) throw badRequest('Body is required');
    if (!CATEGORIES.includes(payload.category)) throw badRequest('A valid category is required');
    if (!CONTENT_TYPES.includes(payload.contentType)) throw badRequest('A valid content type is required');
    if (!DIFFICULTIES.includes(payload.difficulty)) throw badRequest('A valid difficulty is required');
    if (payload.recencyTag && !RECENCY_TAGS.includes(payload.recencyTag)) delete payload.recencyTag;
    if (payload.readingLevel && !READING_LEVELS.includes(payload.readingLevel)) delete payload.readingLevel;

    payload.slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
    if (!payload.slug) throw badRequest('Could not derive a slug from the title');

    const status = req.body.status === 'published' ? 'published' : 'draft';

    const item = await ContentItem.create({
      ...payload,
      status,
      publishedAt: status === 'published' ? new Date() : null,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({ item: contentDetail(item) });
  } catch (err) {
    next(err);
  }
}

async function updateContent(req, res, next) {
  try {
    const item = await ContentItem.findById(req.params.id);
    if (!item) throw notFound('Content not found');

    const payload = pickContentPayload(req.body || {});
    if (payload.slug !== undefined) payload.slug = slugify(payload.slug);
    Object.assign(item, payload);
    item.updatedBy = req.user._id;
    await item.save();

    res.json({ item: contentDetail(item) });
  } catch (err) {
    next(err);
  }
}

function setStatus(status) {
  return async (req, res, next) => {
    try {
      const item = await ContentItem.findById(req.params.id);
      if (!item) throw notFound('Content not found');
      item.status = status;
      if (status === 'published' && !item.publishedAt) item.publishedAt = new Date();
      if (status === 'draft') item.publishedAt = null;
      item.updatedBy = req.user._id;
      await item.save();
      res.json({ item: contentDetail(item) });
    } catch (err) {
      next(err);
    }
  };
}

/** DELETE = archive (soft delete) to preserve learner references. */
async function deleteContent(req, res, next) {
  try {
    const item = await ContentItem.findById(req.params.id);
    if (!item) throw notFound('Content not found');
    item.status = 'archived';
    item.updatedBy = req.user._id;
    await item.save();
    res.json({ message: 'Content archived', item: contentListItem(item) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAdminContent,
  getAdminContent,
  createContent,
  updateContent,
  publishContent: setStatus('published'),
  unpublishContent: setStatus('draft'),
  archiveContent: setStatus('archived'),
  deleteContent,
};
