const express = require('express');
const { listContent, getContentById, getContentBySlug } = require('../controllers/contentController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, listContent);
router.get('/slug/:slug', optionalAuth, getContentBySlug);
router.get('/:id', optionalAuth, getContentById);

module.exports = router;
