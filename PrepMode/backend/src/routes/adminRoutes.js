const express = require('express');
const { requireAdmin } = require('../middleware/auth');

const {
  listAdminContent,
  getAdminContent,
  createContent,
  updateContent,
  publishContent,
  unpublishContent,
  archiveContent,
  deleteContent,
} = require('../controllers/adminContentController');

const {
  listAdminQuestions,
  createQuestion,
  updateQuestion,
  publishQuestion,
  archiveQuestion,
} = require('../controllers/adminQuestionController');

const {
  listSourceItems,
  createSourceItem,
  selectSourceItem,
  ignoreSourceItem,
  updateMemo,
} = require('../controllers/adminSourceController');

const { overview, listUsers, listTags } = require('../controllers/adminMetaController');

const router = express.Router();

// Every admin endpoint requires a valid admin token. Deny by default.
router.use(requireAdmin);

router.get('/overview', overview);
router.get('/users', listUsers);
router.get('/tags', listTags);

router.get('/content', listAdminContent);
router.post('/content', createContent);
router.get('/content/:id', getAdminContent);
router.put('/content/:id', updateContent);
router.patch('/content/:id/publish', publishContent);
router.patch('/content/:id/unpublish', unpublishContent);
router.patch('/content/:id/archive', archiveContent);
router.delete('/content/:id', deleteContent);

router.get('/questions', listAdminQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.patch('/questions/:id/publish', publishQuestion);
router.patch('/questions/:id/archive', archiveQuestion);

router.get('/source-items', listSourceItems);
router.post('/source-items', createSourceItem);
router.patch('/source-items/:id/select', selectSourceItem);
router.patch('/source-items/:id/ignore', ignoreSourceItem);
router.patch('/source-items/:id/memo', updateMemo);

module.exports = router;
