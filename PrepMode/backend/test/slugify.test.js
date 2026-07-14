const { test } = require('node:test');
const assert = require('node:assert/strict');

const { slugify } = require('../src/utils/slugify');

test('converts titles to kebab-case', () => {
  assert.equal(slugify('Parajumbles Strategy for CAT'), 'parajumbles-strategy-for-cat');
});

test('removes apostrophes and punctuation', () => {
  assert.equal(slugify("India's Growth Story: Staying the Course!"), 'indias-growth-story-staying-the-course');
});

test('trims leading and trailing separators', () => {
  assert.equal(slugify('  --Hello World--  '), 'hello-world');
});

test('caps slug length', () => {
  assert.ok(slugify('a'.repeat(300)).length <= 96);
});
