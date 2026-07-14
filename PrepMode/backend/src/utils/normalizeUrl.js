const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'fbclid',
  'mc_cid',
  'mc_eid',
  'ref',
  'igshid',
]);

/**
 * Normalize a source URL for deduplication: lowercase scheme/host, drop the
 * fragment, strip common tracking parameters, sort remaining query params.
 * Meaningful identifiers are preserved; this is dedupe-grade, not aggressive
 * canonicalization.
 */
function normalizeSourceUrl(rawUrl) {
  const url = new URL(String(rawUrl).trim());
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = '';

  const kept = [];
  for (const [key, value] of url.searchParams.entries()) {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) kept.push([key, value]);
  }
  kept.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));

  url.search = '';
  const params = new URLSearchParams();
  for (const [key, value] of kept) params.append(key, value);
  const query = params.toString();

  let pathname = url.pathname;
  if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);

  return `${url.protocol}//${url.host}${pathname}${query ? `?${query}` : ''}`;
}

module.exports = { normalizeSourceUrl };
