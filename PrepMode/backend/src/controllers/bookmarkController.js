const Bookmark = require('../models/Bookmark');
const ContentItem = require('../models/ContentItem');
const { contentListItem } = require('../utils/serializers');
const { badRequest, notFound } = require('../utils/httpError');

/** Own bookmarks with content summary cards (never the full body). */
async function listBookmarks(req, res, next) {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('content');
    res.json({
      bookmarks: bookmarks
        .filter((b) => b.content && b.content.status === 'published')
        .map((b) => ({
          id: String(b._id),
          examModeAtSave: b.examModeAtSave,
          savedAt: b.createdAt,
          content: contentListItem(b.content),
        })),
    });
  } catch (err) {
    next(err);
  }
}

async function createBookmark(req, res, next) {
  try {
    const { contentId } = req.body || {};
    if (!contentId) throw badRequest('contentId is required');

    const content = await ContentItem.findById(contentId);
    if (!content || content.status !== 'published') throw notFound('Content not found');

    const bookmark = await Bookmark.create({
      user: req.user._id,
      content: content._id,
      examModeAtSave: req.user.activeExamMode || 'All',
    });

    res.status(201).json({
      bookmark: {
        id: String(bookmark._id),
        examModeAtSave: bookmark.examModeAtSave,
        savedAt: bookmark.createdAt,
        content: contentListItem(content),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteBookmark(req, res, next) {
  try {
    const deleted = await Bookmark.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) throw notFound('Bookmark not found');
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listBookmarks, createBookmark, deleteBookmark };
