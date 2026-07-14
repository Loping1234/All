const express = require('express');
const { summary, history, byMode, markComplete, unmarkComplete } = require('../controllers/progressController');
const { requireLearner } = require('../middleware/auth');

const router = express.Router();

router.use(requireLearner);
router.get('/summary', summary);
router.get('/', history);
router.get('/by-mode/:examMode', byMode);
router.post('/content/:contentId/complete', markComplete);
router.delete('/content/:contentId/complete', unmarkComplete);

module.exports = router;
