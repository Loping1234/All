const { test } = require('node:test');
const assert = require('node:assert/strict');

const { normalizeSourceUrl } = require('../src/utils/normalizeUrl');

test('lowercases scheme and host', () => {
  assert.equal(normalizeSourceUrl('HTTPS://Example.GOV/Release'), 'https://example.gov/Release');
});

test('strips fragments', () => {
  assert.equal(normalizeSourceUrl('https://example.gov/page#section-2'), 'https://example.gov/page');
});

test('strips tracking params but keeps meaningful identifiers', () => {
  assert.equal(
    normalizeSourceUrl('https://example.gov/release?id=123&utm_source=rss&utm_medium=feed'),
    'https://example.gov/release?id=123'
  );
});

test('sorts remaining query parameters for stable dedupe keys', () => {
  const a = normalizeSourceUrl('https://example.gov/r?b=2&a=1');
  const b = normalizeSourceUrl('https://example.gov/r?a=1&b=2');
  assert.equal(a, b);
});

test('removes a single trailing slash on paths', () => {
  assert.equal(normalizeSourceUrl('https://example.gov/page/'), 'https://example.gov/page');
  assert.equal(normalizeSourceUrl('https://example.gov/'), 'https://example.gov');
});

test('does not collapse distinct documents', () => {
  const a = normalizeSourceUrl('https://example.gov/release?id=123');
  const b = normalizeSourceUrl('https://example.gov/release?id=124');
  assert.notEqual(a, b);
});

test('throws on invalid URLs', () => {
  assert.throws(() => normalizeSourceUrl('not a url'));
});
