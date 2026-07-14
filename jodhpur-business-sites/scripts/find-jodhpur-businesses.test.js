import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPlaceDetailsUrl,
  buildPlacesUrl,
  deduplicateBusinesses,
  interleaveGroups,
  mergePlaceDetails,
  normalizeFeature,
  toCsv,
} from './find-jodhpur-businesses.js';

test('buildPlacesUrl targets Jodhpur with all requested categories and a limit of 10', () => {
  const url = new URL(buildPlacesUrl('catering.restaurant', 'secret'));

  assert.equal(url.origin + url.pathname, 'https://api.geoapify.com/v2/places');
  assert.equal(
    url.searchParams.get('categories'),
    'catering.restaurant',
  );
  assert.equal(url.searchParams.get('filter'), 'circle:73.0243,26.2389,10000');
  assert.equal(url.searchParams.get('bias'), 'proximity:73.0243,26.2389');
  assert.equal(url.searchParams.get('conditions'), 'named');
  assert.equal(url.searchParams.get('limit'), '10');
  assert.equal(url.searchParams.get('apiKey'), 'secret');
});

test('buildPlaceDetailsUrl requests the details feature by place_id', () => {
  const url = new URL(buildPlaceDetailsUrl('place-1', 'secret'));

  assert.equal(url.origin + url.pathname, 'https://api.geoapify.com/v2/place-details');
  assert.equal(url.searchParams.get('id'), 'place-1');
  assert.equal(url.searchParams.get('features'), 'details');
  assert.equal(url.searchParams.get('lang'), 'en');
  assert.equal(url.searchParams.get('apiKey'), 'secret');
});

test('normalizeFeature maps Geoapify properties without inventing data', () => {
  const business = normalizeFeature({
    geometry: { coordinates: [73.03, 26.24] },
    properties: {
      place_id: 'place-1',
      name: 'Example Cafe',
      categories: ['catering.cafe', 'commercial'],
      formatted: 'Jodhpur, Rajasthan',
      contact: { phone: '+91 12345 67890' },
      website: 'https://example.test',
      lat: 26.24,
      lon: 73.03,
    },
  });

  assert.deepEqual(business, {
    name: 'Example Cafe',
    category: 'catering.cafe',
    address: 'Jodhpur, Rajasthan',
    phone: '+91 12345 67890',
    website: 'https://example.test',
    website_status: 'unclear',
    opening_hours: '',
    latitude: 26.24,
    longitude: 73.03,
    place_id: 'place-1',
    place_details_status: 'pending',
    source: 'Geoapify',
  });
});

test('normalizeFeature keeps unverified Places results unclear', () => {
  assert.equal(normalizeFeature({ properties: { place_id: 'complete' } }).website_status, 'unclear');
  assert.equal(normalizeFeature({ geometry: null }).website_status, 'unclear');
});

test('normalizeFeature preserves a numeric Geoapify phone value as text', () => {
  const business = normalizeFeature({
    properties: { place_id: 'place-1', contact: { phone: 911234567890 } },
  });
  assert.equal(business.phone, '911234567890');
});

test('mergePlaceDetails classifies a successful details response with a website', () => {
  const candidate = normalizeFeature({
    properties: {
      name: 'List Name',
      formatted: 'List Address',
      categories: ['catering.cafe'],
      lat: 26.2,
      lon: 73.0,
      place_id: 'place-1',
    },
  }, 'catering.cafe');
  const verified = mergePlaceDetails(candidate, {
    ok: true,
    response: {
      features: [{
        properties: {
          feature_type: 'details',
          name: 'Details Name',
          formatted: 'Details Address',
          contact: { phone: '+91 12345' },
          website: 'https://example.test',
          opening_hours: 'Mo-Fr 09:00-18:00',
          categories: ['catering.cafe'],
          lat: 26.3,
          lon: 73.1,
          place_id: 'place-1',
        },
      }],
    },
  });

  assert.deepEqual(verified, {
    name: 'Details Name',
    category: 'catering.cafe',
    address: 'Details Address',
    phone: '+91 12345',
    website: 'https://example.test',
    website_status: 'has_website',
    opening_hours: 'Mo-Fr 09:00-18:00',
    latitude: 26.3,
    longitude: 73.1,
    place_id: 'place-1',
    place_details_status: 'success',
    source: 'Geoapify',
  });
});

test('mergePlaceDetails marks successful details without a website as none', () => {
  const candidate = normalizeFeature({
    properties: { name: 'Cafe', formatted: 'Jodhpur', lat: 26.2, lon: 73, place_id: 'place-1' },
  }, 'catering.cafe');
  const verified = mergePlaceDetails(candidate, {
    ok: true,
    response: {
      features: [{
        properties: {
          feature_type: 'details',
          name: 'Cafe',
          formatted: 'Jodhpur',
          lat: 26.2,
          lon: 73,
          place_id: 'place-1',
        },
      }],
    },
  });

  assert.equal(verified.website, '');
  assert.equal(verified.website_status, 'none');
  assert.equal(verified.place_details_status, 'success');
});

test('mergePlaceDetails accepts a canonical details place_id when identity matches', () => {
  const candidate = normalizeFeature({
    properties: { name: 'Cafe', formatted: 'Jodhpur', lat: 26.2, lon: 73, place_id: 'requested-id' },
  }, 'catering.cafe');
  const verified = mergePlaceDetails(candidate, {
    ok: true,
    response: {
      features: [{
        properties: {
          feature_type: 'details',
          name: 'Cafe',
          formatted: 'Jodhpur',
          lat: 26.2,
          lon: 73,
          place_id: 'canonical-id',
        },
      }],
    },
  });

  assert.equal(verified.place_details_status, 'success');
  assert.equal(verified.place_id, 'requested-id');
  assert.equal(verified.website_status, 'none');
});

test('mergePlaceDetails marks failed or insufficient lookups unclear', () => {
  const candidate = normalizeFeature({
    properties: { name: 'Cafe', formatted: 'Jodhpur', lat: 26.2, lon: 73, place_id: 'place-1' },
  }, 'catering.cafe');

  assert.equal(mergePlaceDetails(candidate, { ok: false }).website_status, 'unclear');
  assert.equal(
    mergePlaceDetails(candidate, { ok: true, response: { features: [] } }).website_status,
    'unclear',
  );
});

test('deduplicateBusinesses prefers place_id and uses a stable fallback key', () => {
  const rows = [
    { place_id: 'same', name: 'One', address: '', latitude: 1, longitude: 2 },
    { place_id: 'same', name: 'Duplicate', address: '', latitude: 3, longitude: 4 },
    { place_id: '', name: 'Fallback', address: 'Road', latitude: 5, longitude: 6 },
    { place_id: '', name: ' fallback ', address: ' road ', latitude: 50, longitude: 60 },
  ];

  assert.deepEqual(deduplicateBusinesses(rows), [rows[0], rows[2]]);
});

test('interleaveGroups gives each requested category a chance before the 10-row cap', () => {
  assert.deepEqual(
    interleaveGroups([['r1', 'r2'], ['c1', 'c2'], ['s1']]),
    ['r1', 'c1', 's1', 'r2', 'c2'],
  );
});

test('toCsv writes the required columns and escapes commas and quotes', () => {
  const csv = toCsv([{
    name: 'Cafe, "Blue"',
    category: 'catering.cafe',
    address: 'Jodhpur',
    phone: '',
    website: '',
    website_status: 'none',
    opening_hours: '',
    latitude: 26.2,
    longitude: 73,
    place_id: 'id-1',
    place_details_status: 'success',
    source: 'Geoapify',
  }]);

  const [header, row] = csv.trimEnd().split('\n');
  assert.equal(
    header,
    'name,category,address,phone,website,website_status,opening_hours,latitude,longitude,place_id,place_details_status,source',
  );
  assert.match(row, /^"Cafe, ""Blue""",/);
});
