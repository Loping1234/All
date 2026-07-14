const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  EXAM_MODES,
  CATEGORIES,
  ROLES,
  CONTENT_STATUSES,
  PROCESSING_STATUSES,
} = require('../src/utils/enums');

test('exam modes match the product contract exactly', () => {
  assert.deepEqual(EXAM_MODES, ['All', 'CAT', 'UPSC', 'SSC', 'Banking', 'CLAT', 'CUET', 'MBA', 'Defence Exams']);
});

test('categories match the product contract exactly', () => {
  assert.deepEqual(CATEGORIES, ['English', 'Vocabulary', 'GK', 'Static GK', 'Current Affairs', 'Editorials', 'Revision']);
});

test('only two strict roles exist', () => {
  assert.deepEqual(ROLES, ['admin', 'registered_learner']);
});

test('content lifecycle statuses', () => {
  assert.deepEqual(CONTENT_STATUSES, ['draft', 'published', 'archived']);
});

test('source inbox processing statuses', () => {
  assert.deepEqual(PROCESSING_STATUSES, ['new', 'selected', 'ignored']);
});
