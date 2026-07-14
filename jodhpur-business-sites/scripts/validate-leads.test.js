import assert from 'node:assert/strict';
import test from 'node:test';

import { REQUIRED_COLUMNS, validateRows } from './validate-leads.js';

function validRow(overrides = {}) {
  return {
    name: 'Cafe',
    category: 'catering.cafe',
    address: 'Jodhpur',
    phone: '',
    website: '',
    website_status: 'none',
    opening_hours: '',
    latitude: '26.2',
    longitude: '73.0',
    place_id: 'place-1',
    place_details_status: 'success',
    source: 'Geoapify',
    ...overrides,
  };
}

test('validateRows accepts the required verified lead columns and reports missing phones', () => {
  const result = validateRows(REQUIRED_COLUMNS, [validRow()]);
  assert.deepEqual(result, { rows: 1, missing_phone: 1 });
});

test('validateRows rejects missing required columns', () => {
  assert.throws(
    () => validateRows(REQUIRED_COLUMNS.filter((column) => column !== 'place_id'), [validRow()]),
    /Missing required column: place_id/,
  );
});

test('validateRows rejects duplicate place_id values', () => {
  assert.throws(
    () => validateRows(REQUIRED_COLUMNS, [validRow(), validRow()]),
    /Duplicate place_id: place-1/,
  );
});

test('validateRows rejects missing coordinates and invalid website statuses', () => {
  assert.throws(
    () => validateRows(REQUIRED_COLUMNS, [validRow({ latitude: '' })]),
    /Missing or invalid latitude/,
  );
  assert.throws(
    () => validateRows(REQUIRED_COLUMNS, [validRow({ website_status: 'maybe' })]),
    /Invalid website_status/,
  );
});

test('validateRows requires failed or insufficient details lookups to be unclear', () => {
  assert.throws(
    () => validateRows(REQUIRED_COLUMNS, [validRow({ place_details_status: 'failed' })]),
    /must be marked unclear/,
  );
  assert.throws(
    () => validateRows(REQUIRED_COLUMNS, [validRow({ place_details_status: 'insufficient' })]),
    /must be marked unclear/,
  );
});
