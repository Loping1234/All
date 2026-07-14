const express = require('express');
const { startAttempt, submitAttempt, listAttempts, getAttempt } = require('../controllers/quizAttemptController');
const { requireLearner } = require('../middleware/auth');

const router = express.Router();

router.use(requireLearner);
router.post('/start', startAttempt);
router.post('/:id/submit', submitAttempt);
router.get('/', listAttempts);
router.get('/:id', getAttempt);

module.exports = router;
