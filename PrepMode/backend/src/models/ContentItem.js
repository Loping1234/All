const mongoose = require('mongoose');
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

const sourceMetadataSchema = new mongoose.Schema(
  {
    sourceName: { type: String, trim: true },
    sourceType: { type: String, enum: SOURCE_TYPES },
    sourceUrl: { type: String, trim: true },
    sourceDate: { type: Date },
  },
  { _id: false }
);

const contentItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, required: true, trim: true, maxlength: 400 },
    body: { type: String, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    subjectTags: { type: [String], default: [] },
    topicTags: { type: [String], default: [] },
    examModeTags: { type: [String], enum: EXAM_MODES, default: ['All'] },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    contentType: { type: String, enum: CONTENT_TYPES, required: true },
    recencyTag: { type: String, enum: RECENCY_TAGS, default: 'Evergreen' },
    readingLevel: { type: String, enum: READING_LEVELS, default: 'Intermediate' },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft', required: true },
    publishedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sourceMetadata: { type: sourceMetadataSchema, default: null },
  },
  { timestamps: true }
);

contentItemSchema.index({ status: 1, category: 1, publishedAt: -1 });
contentItemSchema.index({ status: 1, examModeTags: 1 });
contentItemSchema.index({ title: 'text', summary: 'text', topicTags: 'text' });

module.exports = mongoose.model('ContentItem', contentItemSchema);
