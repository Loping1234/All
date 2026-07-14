const SourceItem = require('../models/SourceItem');
const { sourceItem } = require('../utils/serializers');
const { badRequest, notFound, conflict } = require('../utils/httpError');
const { normalizeSourceUrl } = require('../utils/normalizeUrl');
const { SOURCE_TYPES, FEED_TYPES, PROCESSING_STATUSES } = require('../utils/enums');

async function listSourceItems(req, res, next) {
  try {
    const filter = {};
    if (req.query.processingStatus && PROCESSING_STATUSES.includes(req.query.processingStatus)) {
      filter.processingStatus = req.query.processingStatus;
    }
    if (req.query.sourceType && SOURCE_TYPES.includes(req.query.sourceType)) {
      filter.sourceType = req.query.sourceType;
    }
    if (req.query.from || req.query.to) {
      filter.sourceDate = {};
      if (req.query.from) filter.sourceDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.sourceDate.$lte = new Date(req.query.to);
    }
    if (req.query.search) {
      const safe = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { sourceName: { $regex: safe, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '20', 10) || 20));

    const [items, total, counts] = await Promise.all([
      SourceItem.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      SourceItem.countDocuments(filter),
      SourceItem.aggregate([{ $group: { _id: '$processingStatus', count: { $sum: 1 } } }]),
    ]);

    const statusCounts = { new: 0, selected: 0, ignored: 0 };
    for (const row of counts) statusCounts[row._id] = row.count;

    res.json({
      items: items.map(sourceItem),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), statusCounts },
    });
  } catch (err) {
    next(err);
  }
}

/** Manual source entry. Metadata only — never a full article body. */
async function createSourceItem(req, res, next) {
  try {
    const { sourceName, sourceType, sourceUrl, title, sourceDate, feedType, internalMemo, feedExcerpt } =
      req.body || {};
    if (!sourceName) throw badRequest('sourceName is required');
    if (!SOURCE_TYPES.includes(sourceType)) throw badRequest('A valid sourceType is required');
    if (!sourceUrl) throw badRequest('sourceUrl is required');
    if (!title) throw badRequest('title is required');

    let normalized;
    try {
      normalized = normalizeSourceUrl(sourceUrl);
    } catch {
      throw badRequest('sourceUrl is not a valid URL');
    }

    const existing = await SourceItem.findOne({ normalizedSourceUrl: normalized });
    if (existing) {
      throw conflict('A source with this URL already exists in the inbox', 'DUPLICATE_SOURCE_URL');
    }

    const item = await SourceItem.create({
      sourceName: String(sourceName).slice(0, 120),
      sourceType,
      sourceUrl: String(sourceUrl).slice(0, 500),
      normalizedSourceUrl: normalized,
      title: String(title).slice(0, 240),
      sourceDate: sourceDate ? new Date(sourceDate) : null,
      feedType: FEED_TYPES.includes(feedType) ? feedType : 'manual',
      fetchedAt: new Date(),
      internalMemo: internalMemo ? String(internalMemo).slice(0, 1000) : '',
      feedExcerpt: feedExcerpt ? String(feedExcerpt).slice(0, 300) : '',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({ item: sourceItem(item) });
  } catch (err) {
    next(err);
  }
}

function setProcessingStatus(status) {
  return async (req, res, next) => {
    try {
      const item = await SourceItem.findById(req.params.id);
      if (!item) throw notFound('Source item not found');
      item.processingStatus = status;
      item.updatedBy = req.user._id;
      await item.save();
      res.json({ item: sourceItem(item) });
    } catch (err) {
      next(err);
    }
  };
}

async function updateMemo(req, res, next) {
  try {
    const item = await SourceItem.findById(req.params.id);
    if (!item) throw notFound('Source item not found');
    const { internalMemo } = req.body || {};
    item.internalMemo = internalMemo == null ? '' : String(internalMemo).slice(0, 1000);
    item.updatedBy = req.user._id;
    await item.save();
    res.json({ item: sourceItem(item) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSourceItems,
  createSourceItem,
  selectSourceItem: setProcessingStatus('selected'),
  ignoreSourceItem: setProcessingStatus('ignored'),
  updateMemo,
};
