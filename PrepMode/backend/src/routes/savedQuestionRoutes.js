const express = require('express');
const {
  listSavedQuestions,
  createSavedQuestion,
  deleteSavedQuestion,
} = require('../controllers/savedQuestionController');
const { requireLearner } = require('../middleware/auth');

const router = express.Router();

router.use(requireLearner);
router.get('/', listSavedQuestions);
router.post('/', createSavedQuestion);
router.delete('/:id', deleteSavedQuestion);

module.exports = router;
