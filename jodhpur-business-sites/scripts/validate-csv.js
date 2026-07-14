import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_COLUMNS = [
  "name",
  "category",
  "address",
  "phone",
  "website",
  "website_status",
  "latitude",
  "longitude",
  "place_id",
  "source",
];

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function validateCsv(filePath) {
  console.log(`Validating CSV: ${filePath}`);
  const content = await readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error(`CSV is empty: ${filePath}`);
  }

  const headerColumns = parseCsvLine(lines[0]);
  if (headerColumns.length !== REQUIRED_COLUMNS.length) {
    throw new Error(`CSV header column count mismatch. Expected ${REQUIRED_COLUMNS.length}, got ${headerColumns.length}`);
  }

  for (let i = 0; i < REQUIRED_COLUMNS.length; i++) {
    if (headerColumns[i] !== REQUIRED_COLUMNS[i]) {
      throw new Error(`Header mismatch at index ${i}: expected "${REQUIRED_COLUMNS[i]}", got "${headerColumns[i]}"`);
    }
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length !== REQUIRED_COLUMNS.length) {
      throw new Error(`Row ${i} column count mismatch. Expected ${REQUIRED_COLUMNS.length}, got ${row.length}`);
    }

    const business = {};
    REQUIRED_COLUMNS.forEach((col, idx) => {
      business[col] = row[idx];
    });

    // Check for API key leakage
    if (apiKey && lines[i].includes(apiKey)) {
      throw new Error(`CRITICAL: GEOAPIFY_API_KEY detected in row ${i} of CSV!`);
    }

    // Verify name
    if (!business.name.trim()) {
      throw new Error(`Row ${i}: Missing business name.`);
    }

    // Verify category
    if (!business.category.trim()) {
      throw new Error(`Row ${i}: Missing category.`);
    }

    // Verify website status
    if (!["has_website", "none", "unclear"].includes(business.website_status)) {
      throw new Error(`Row ${i}: Invalid website_status "${business.website_status}".`);
    }

    // Verify coordinates
    const lat = parseFloat(business.latitude);
    const lon = parseFloat(business.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error(`Row ${i}: Invalid latitude "${business.latitude}".`);
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      throw new Error(`Row ${i}: Invalid longitude "${business.longitude}".`);
    }
  }

  console.log(`PASS: CSV "${path.basename(filePath)}" is valid.`);
}

async function run() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const processedDirectory = path.join(scriptDirectory, "..", "data", "processed");
  const allPath = path.join(processedDirectory, "jodhpur_businesses.csv");
  const noWebsitePath = path.join(processedDirectory, "jodhpur_no_website.csv");

  try {
    await validateCsv(allPath);
    await validateCsv(noWebsitePath);
  } catch (error) {
    console.error(`Validation Failed: ${error.message}`);
    process.exit(1);
  }
}

run();
