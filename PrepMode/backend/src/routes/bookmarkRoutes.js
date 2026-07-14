const express = require('express');
const { listBookmarks, createBookmark, deleteBookmark } = require('../controllers/bookmarkController');
const { requireLearner } = require('../middleware/auth');

const router = express.Router();

router.use(requireLearner);
router.get('/', listBookmarks);
router.post('/', createBookmark);
router.delete('/:id', deleteBookmark);

module.exports = router;
