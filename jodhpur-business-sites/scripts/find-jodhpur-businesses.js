import "dotenv/config";

import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LATITUDE = 26.2389;
const LONGITUDE = 73.0243;
const SEARCH_RADIUS_METERS = 10000;
const FIRST_RUN_LIMIT = 10;

export const CATEGORY_MAP = {
  "catering.restaurant": "restaurants.json",
  "catering.cafe": "cafes.json",
  "commercial.clothing": "clothing.json",
  "commercial.health_and_beauty": "health_beauty.json",
  commercial: "commercial.json",
};

export const CSV_COLUMNS = [
  "name",
  "category",
  "address",
  "phone",
  "website",
  "website_status",
  "opening_hours",
  "latitude",
  "longitude",
  "place_id",
  "place_details_status",
  "source",
];

export function buildPlacesUrl(category, apiKey) {
  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", category);
  url.searchParams.set(
    "filter",
    `circle:${LONGITUDE},${LATITUDE},${SEARCH_RADIUS_METERS}`,
  );
  url.searchParams.set("bias", `proximity:${LONGITUDE},${LATITUDE}`);
  url.searchParams.set("conditions", "named");
  url.searchParams.set("limit", String(FIRST_RUN_LIMIT));
  url.searchParams.set("lang", "en");
  url.searchParams.set("apiKey", apiKey);
  return url.toString();
}

export function buildPlaceDetailsUrl(placeId, apiKey) {
  const url = new URL("https://api.geoapify.com/v2/place-details");
  url.searchParams.set("id", placeId);
  url.searchParams.set("features", "details");
  url.searchParams.set("lang", "en");
  url.searchParams.set("apiKey", apiKey);
  return url.toString();
}

function cleanScalar(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function cleanOpeningHours(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "";
}

function selectCategory(categories, primaryCategory = "") {
  if (!Array.isArray(categories)) {
    return primaryCategory;
  }
  return Object.keys(CATEGORY_MAP).find((category) => categories.includes(category))
    ?? cleanScalar(categories[0])
    ?? primaryCategory;
}

function coordinate(properties, geometry, propertyName, coordinateIndex) {
  const propertyValue = properties?.[propertyName];
  if (Number.isFinite(propertyValue)) {
    return propertyValue;
  }
  const geometryValue = geometry?.coordinates?.[coordinateIndex];
  return Number.isFinite(geometryValue) ? geometryValue : "";
}

export function normalizeFeature(feature, primaryCategory = "") {
  const properties = feature?.properties;
  return {
    name: cleanScalar(properties?.name),
    category: selectCategory(properties?.categories, primaryCategory),
    address: cleanScalar(properties?.formatted),
    phone: cleanScalar(properties?.contact?.phone ?? properties?.phone),
    website: cleanScalar(properties?.website ?? properties?.contact?.website),
    website_status: "unclear",
    opening_hours: "",
    latitude: coordinate(properties, feature?.geometry, "lat", 1),
    longitude: coordinate(properties, feature?.geometry, "lon", 0),
    place_id: cleanScalar(properties?.place_id),
    place_details_status: "pending",
    source: "Geoapify",
  };
}

function normalizeKeyPart(value) {
  return String(value ?? "").trim().toLocaleLowerCase("en");
}

function deduplicationKey(business) {
  if (business.place_id) {
    return `place:${business.place_id}`;
  }
  const name = normalizeKeyPart(business.name);
  const address = normalizeKeyPart(business.address);
  return address
    ? ["fallback", name, address].join("|")
    : [
      "fallback",
      name,
      normalizeKeyPart(business.latitude),
      normalizeKeyPart(business.longitude),
    ].join("|");
}

export function deduplicateBusinesses(businesses) {
  const seen = new Set();
  const unique = [];
  for (const business of businesses) {
    const key = deduplicationKey(business);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(business);
    }
  }
  return unique;
}

export function interleaveGroups(groups) {
  const interleaved = [];
  const longest = Math.max(0, ...groups.map((group) => group.length));
  for (let index = 0; index < longest; index += 1) {
    for (const group of groups) {
      if (index < group.length) {
        interleaved.push(group[index]);
      }
    }
  }
  return interleaved;
}

function detailProperties(response) {
  if (!Array.isArray(response?.features)) {
    return null;
  }
  return response.features.find(
    (feature) => feature?.properties?.feature_type === "details",
  )?.properties ?? null;
}

function hasEnoughDetails(properties, candidate) {
  if (!properties || !cleanScalar(properties.place_id)) {
    return false;
  }
  const identityMatches = cleanScalar(properties.place_id) === candidate.place_id
    || (cleanScalar(properties.name)
      && normalizeKeyPart(properties.name) === normalizeKeyPart(candidate.name))
    || (cleanScalar(properties.formatted)
      && normalizeKeyPart(properties.formatted) === normalizeKeyPart(candidate.address));
  if (!identityMatches) {
    return false;
  }
  return [
    properties.name,
    properties.formatted,
    properties.contact?.phone,
    properties.website,
    properties.opening_hours,
    properties.categories,
    properties.lat,
    properties.lon,
  ].some((value) => value !== undefined && value !== null && value !== "");
}

export function mergePlaceDetails(candidate, lookup) {
  if (!candidate.place_id) {
    return {
      ...candidate,
      website: "",
      website_status: "unclear",
      place_details_status: "missing_place_id",
    };
  }
  if (!lookup?.ok) {
    return {
      ...candidate,
      website: "",
      website_status: "unclear",
      place_details_status: "failed",
    };
  }

  const properties = detailProperties(lookup.response);
  const websiteValueIsInvalid = properties?.website !== undefined
    && properties?.website !== null
    && typeof properties.website !== "string";
  if (!hasEnoughDetails(properties, candidate) || websiteValueIsInvalid) {
    return {
      ...candidate,
      website: "",
      website_status: "unclear",
      place_details_status: "insufficient",
    };
  }

  const website = cleanScalar(properties.website);
  return {
    name: cleanScalar(properties.name) || candidate.name,
    category: selectCategory(properties.categories, candidate.category),
    address: cleanScalar(properties.formatted) || candidate.address,
    phone: cleanScalar(properties.contact?.phone) || candidate.phone,
    website,
    website_status: website ? "has_website" : "none",
    opening_hours: cleanOpeningHours(properties.opening_hours),
    latitude: Number.isFinite(properties.lat) ? properties.lat : candidate.latitude,
    longitude: Number.isFinite(properties.lon) ? properties.lon : candidate.longitude,
    place_id: candidate.place_id,
    place_details_status: "success",
    source: "Geoapify",
  };
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(CSV_COLUMNS.map((column) => csvCell(row[column])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

async function writeAtomically(filePath, contents) {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, contents, "utf8");
  await rename(temporaryPath, filePath);
}

async function fetchAndSaveResponse(url, rawPath, apiKey) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    const errorPath = rawPath.replace(/\.json$/i, ".error.json");
    await writeAtomically(errorPath, '{"failure_kind":"network_failure"}\n');
    return { ok: false, failure: "network_failure" };
  }

  const rawBody = await response.text();
  if (apiKey && rawBody.includes(apiKey)) {
    throw new Error("Geoapify response unexpectedly contained sensitive data.");
  }
  await writeAtomically(rawPath, rawBody);

  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { ok: false, failure: "invalid_json", status: response.status };
  }

  return response.ok
    ? { ok: true, response: parsed, status: response.status }
    : { ok: false, response: parsed, failure: "http_error", status: response.status };
}

function detailRawFilename(placeId) {
  return `${Buffer.from(placeId, "utf8").toString("base64url")}.json`;
}

export async function runDiscovery() {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new Error("GEOAPIFY_API_KEY is missing.");
  }

  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..");
  const rawDirectory = path.join(projectRoot, "data", "raw");
  const detailsRawDirectory = path.join(rawDirectory, "place_details");
  const processedDirectory = path.join(projectRoot, "data", "processed");
  await Promise.all([
    mkdir(rawDirectory, { recursive: true }),
    mkdir(detailsRawDirectory, { recursive: true }),
    mkdir(processedDirectory, { recursive: true }),
  ]);

  let rawPlacesFound = 0;
  const categoryGroups = [];
  for (const [category, filename] of Object.entries(CATEGORY_MAP)) {
    const rawPath = path.join(rawDirectory, filename);
    const lookup = await fetchAndSaveResponse(buildPlacesUrl(category, apiKey), rawPath, apiKey);
    if (!lookup.ok) {
      throw new Error(`Geoapify Places request failed for ${category}.`);
    }
    const features = Array.isArray(lookup.response?.features) ? lookup.response.features : [];
    rawPlacesFound += features.length;
    categoryGroups.push(features.map((feature) => normalizeFeature(feature, category)));
  }

  const candidates = deduplicateBusinesses(interleaveGroups(categoryGroups))
    .slice(0, FIRST_RUN_LIMIT);
  const verified = [];
  for (const candidate of candidates) {
    if (!candidate.place_id) {
      verified.push(mergePlaceDetails(candidate, { ok: false }));
      verified[verified.length - 1].place_details_status = "missing_place_id";
      continue;
    }

    const rawPath = path.join(detailsRawDirectory, detailRawFilename(candidate.place_id));
    const lookup = await fetchAndSaveResponse(
      buildPlaceDetailsUrl(candidate.place_id, apiKey),
      rawPath,
      apiKey,
    );
    verified.push(mergePlaceDetails(candidate, lookup));
  }

  const noWebsite = verified.filter((business) => business.website_status === "none");
  const unclear = verified.filter((business) => business.website_status === "unclear");
  const allPath = path.join(processedDirectory, "jodhpur_businesses_verified.csv");
  const noWebsitePath = path.join(processedDirectory, "jodhpur_no_website_verified.csv");
  const unclearPath = path.join(processedDirectory, "jodhpur_unclear.csv");
  await Promise.all([
    writeAtomically(allPath, toCsv(verified)),
    writeAtomically(noWebsitePath, toCsv(noWebsite)),
    writeAtomically(unclearPath, toCsv(unclear)),
  ]);

  const counts = verified.reduce(
    (result, business) => {
      result[business.website_status] += 1;
      if (business.place_details_status === "success") {
        result.details_successful += 1;
      } else {
        result.details_failed += 1;
      }
      return result;
    },
    {
      has_website: 0,
      none: 0,
      unclear: 0,
      details_successful: 0,
      details_failed: 0,
    },
  );

  console.log(`raw places found: ${rawPlacesFound}`);
  console.log(`unique places after dedupe: ${candidates.length}`);
  console.log(`Place Details successful count: ${counts.details_successful}`);
  console.log(`Place Details failed count: ${counts.details_failed}`);
  console.log(`has_website count: ${counts.has_website}`);
  console.log(`none count: ${counts.none}`);
  console.log(`unclear count: ${counts.unclear}`);
  console.log("files created:");
  for (const filename of Object.values(CATEGORY_MAP)) {
    console.log(`- data/raw/${filename}`);
  }
  console.log("- data/raw/place_details/*.json");
  console.log("- data/processed/jodhpur_businesses_verified.csv");
  console.log("- data/processed/jodhpur_no_website_verified.csv");
  console.log("- data/processed/jodhpur_unclear.csv");
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  runDiscovery().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
