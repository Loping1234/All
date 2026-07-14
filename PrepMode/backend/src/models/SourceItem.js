const mongoose = require('mongoose');
const { SOURCE_TYPES, FEED_TYPES, PROCESSING_STATUSES } = require('../utils/enums');

/**
 * Provenance metadata only. PrepMode never stores full third-party article
 * bodies; feedExcerpt is capped to a short metadata-grade snippet.
 */
const sourceItemSchema = new mongoose.Schema(
  {
    sourceName: { type: String, required: true, trim: true, maxlength: 120 },
    sourceType: { type: String, enum: SOURCE_TYPES, required: true },
    sourceUrl: { type: String, required: true, trim: true },
    normalizedSourceUrl: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 240 },
    sourceDate: { type: Date, default: null },
    feedType: { type: String, enum: FEED_TYPES, default: 'manual' },
    fetchedAt: { type: Date, default: Date.now },
    processingStatus: { type: String, enum: PROCESSING_STATUSES, default: 'new', required: true },
    internalMemo: { type: String, trim: true, maxlength: 1000, default: '' },
    feedExcerpt: { type: String, trim: true, maxlength: 300, default: '' },
    relatedContentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

sourceItemSchema.index({ processingStatus: 1, sourceType: 1, createdAt: -1 });

module.exports = mongoose.model('SourceItem', sourceItemSchema);
