const express = require('express');
const { listQuestions, getQuestion } = require('../controllers/questionController');
const { requireLearner } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLearner, listQuestions);
router.get('/:id', requireLearner, getQuestion);

module.exports = router;
