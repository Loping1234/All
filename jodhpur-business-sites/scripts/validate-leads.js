import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const REQUIRED_COLUMNS = [
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

const WEBSITE_STATUSES = new Set(["has_website", "none", "unclear"]);
const DETAILS_STATUSES = new Set(["success", "failed", "insufficient", "missing_place_id"]);

export function parseCsv(content) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;
  const text = content.replace(/^\uFEFF/, "");

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      record.push(field);
      if (record.some((value) => value.length > 0)) {
        records.push(record);
      }
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error("CSV contains an unterminated quoted field.");
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  if (records.length === 0) {
    throw new Error("CSV is empty.");
  }

  const [header, ...data] = records;
  const rows = data.map((values, index) => {
    if (values.length !== header.length) {
      throw new Error(`Row ${index + 1} has an invalid column count.`);
    }
    return Object.fromEntries(header.map((column, columnIndex) => [column, values[columnIndex]]));
  });
  return { header, rows };
}

function validCoordinate(value, minimum, maximum) {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum;
}

export function validateRows(header, rows) {
  for (const column of REQUIRED_COLUMNS) {
    if (!header.includes(column)) {
      throw new Error(`Missing required column: ${column}`);
    }
  }
  if (header.length !== REQUIRED_COLUMNS.length) {
    throw new Error("CSV contains unexpected columns.");
  }

  const placeIds = new Set();
  let missingPhone = 0;
  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 1;
    if (!WEBSITE_STATUSES.has(row.website_status)) {
      throw new Error(`Row ${rowNumber}: Invalid website_status.`);
    }
    if (!DETAILS_STATUSES.has(row.place_details_status)) {
      throw new Error(`Row ${rowNumber}: Invalid place_details_status.`);
    }
    if (!validCoordinate(row.latitude, -90, 90)) {
      throw new Error(`Row ${rowNumber}: Missing or invalid latitude.`);
    }
    if (!validCoordinate(row.longitude, -180, 180)) {
      throw new Error(`Row ${rowNumber}: Missing or invalid longitude.`);
    }
    const placeId = row.place_id.trim();
    if (placeId) {
      if (placeIds.has(placeId)) {
        throw new Error(`Duplicate place_id: ${placeId}`);
      }
      placeIds.add(placeId);
    }
    if (!row.phone.trim()) {
      missingPhone += 1;
    }
    if (row.place_details_status !== "success" && row.website_status !== "unclear") {
      throw new Error(`Row ${rowNumber}: Failed Place Details lookup must be marked unclear.`);
    }
    if (row.website_status === "has_website" && !row.website.trim()) {
      throw new Error(`Row ${rowNumber}: has_website requires a website value.`);
    }
    if (row.website_status === "none" && row.website.trim()) {
      throw new Error(`Row ${rowNumber}: none requires an empty website value.`);
    }
    if (row.source !== "Geoapify") {
      throw new Error(`Row ${rowNumber}: Invalid source.`);
    }
  }
  return { rows: rows.length, missing_phone: missingPhone };
}

async function loadAndValidate(filePath) {
  const parsed = parseCsv(await readFile(filePath, "utf8"));
  return { ...parsed, summary: validateRows(parsed.header, parsed.rows) };
}

function rowKey(row) {
  return JSON.stringify(REQUIRED_COLUMNS.map((column) => row[column]));
}

export async function runValidation() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..");
  const processed = path.join(projectRoot, "data", "processed");
  const master = await loadAndValidate(path.join(processed, "jodhpur_businesses_verified.csv"));
  const noWebsite = await loadAndValidate(path.join(processed, "jodhpur_no_website_verified.csv"));
  const unclear = await loadAndValidate(path.join(processed, "jodhpur_unclear.csv"));

  const expectedNoWebsite = new Set(
    master.rows.filter((row) => row.website_status === "none").map(rowKey),
  );
  const expectedUnclear = new Set(
    master.rows.filter((row) => row.website_status === "unclear").map(rowKey),
  );
  if (noWebsite.rows.length !== expectedNoWebsite.size
    || noWebsite.rows.some((row) => !expectedNoWebsite.has(rowKey(row)))) {
    throw new Error("No-website output does not match verified none rows.");
  }
  if (unclear.rows.length !== expectedUnclear.size
    || unclear.rows.some((row) => !expectedUnclear.has(rowKey(row)))) {
    throw new Error("Unclear output does not match verified unclear rows.");
  }

  console.log(`validated files: 3`);
  console.log(`verified businesses: ${master.summary.rows}`);
  console.log(`missing phone count: ${master.summary.missing_phone}`);
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  runValidation().catch((error) => {
    console.error(`Lead validation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
