import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Workbook } from "@oai/artifact-tool";
import { parseCsv } from "../../scripts/validate-leads.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../..");
const processedDir = path.join(projectRoot, "data", "processed");
const reportsDir = path.join(projectRoot, "reports");
const verificationDownload = "C:/Users/PRANAY/Downloads/businessname-category-searchedquery-officialwebsit.csv";
const cleanedPath = path.join(processedDir, "jodhpur_no_website_cleaned.csv");
const savedVerificationPath = path.join(processedDir, "perplexity_web_verification.csv");
const verifiedGeoapifyPath = path.join(processedDir, "jodhpur_no_website_verified.csv");

await fs.mkdir(processedDir, { recursive: true });
await fs.mkdir(reportsDir, { recursive: true });

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function serializeCsv(columns, rows) {
  return `${[
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n")}\n`;
}

function normalizedName(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en");
}

function exactBusinessKey(row) {
  return [row.name, row.address, row.latitude, row.longitude]
    .map((value) => String(value ?? "").trim().toLocaleLowerCase("en"))
    .join("|");
}

function hasFullUrl(value) {
  return /(?:^|[\s,;])https?:\/\/[^\s,;]+/i.test(String(value ?? ""));
}

function evidenceQuality(value) {
  if (hasFullUrl(value)) return "strong";
  if (String(value ?? "").trim()) return "weak";
  return "missing";
}

const reviewFlags = {
  "rajshree boutique": {
    branch_ambiguous: "no",
    category_ambiguous: "no",
    name_ambiguity: "low",
    address_mismatch: "none",
    category_mismatch: "no",
    possible_website_mismatch: "no",
    phone_call_needed: "no",
    classification_reason: "High-confidence exact phone/address match and no standalone website found.",
  },
  "desi bhoj": {
    branch_ambiguous: "no",
    category_ambiguous: "no",
    name_ambiguity: "low",
    address_mismatch: "none",
    category_mismatch: "no",
    possible_website_mismatch: "no",
    phone_call_needed: "no",
    classification_reason: "Location evidence matches the Geoapify row; no standalone website or social profile found.",
  },
  "rigveda'": {
    branch_ambiguous: "no",
    category_ambiguous: "no",
    name_ambiguity: "low",
    address_mismatch: "none",
    category_mismatch: "no",
    possible_website_mismatch: "no",
    phone_call_needed: "no",
    classification_reason: "Phone and local listings support the same business; no official website found.",
  },
  "mac studio unisex salon": {
    branch_ambiguous: "yes",
    category_ambiguous: "no",
    name_ambiguity: "medium",
    address_mismatch: "medium",
    category_mismatch: "no",
    possible_website_mismatch: "no",
    phone_call_needed: "yes",
    classification_reason: "Multiple Jodhpur branches make the exact Geoapify row uncertain; confirm by phone.",
  },
  "mandap garden and restaurant": {
    branch_ambiguous: "yes",
    category_ambiguous: "no",
    name_ambiguity: "medium",
    address_mismatch: "medium",
    category_mismatch: "no",
    possible_website_mismatch: "no",
    phone_call_needed: "yes",
    classification_reason: "Similar branch/entity listings show conflicting addresses; confirm the NH62 location by phone.",
  },
  "dhanlakshmi store": {
    branch_ambiguous: "no",
    category_ambiguous: "yes",
    name_ambiguity: "medium",
    address_mismatch: "medium",
    category_mismatch: "no",
    possible_website_mismatch: "no",
    phone_call_needed: "yes",
    classification_reason: "The found listing may be a different medical/general store; category and address need phone confirmation.",
  },
  "kashish": {
    branch_ambiguous: "yes",
    category_ambiguous: "no",
    name_ambiguity: "high",
    address_mismatch: "high",
    category_mismatch: "no",
    possible_website_mismatch: "yes",
    phone_call_needed: "no",
    classification_reason: "Several same-name salons and a tentative website do not match the Geoapify address.",
  },
  "brown sugar": {
    branch_ambiguous: "yes",
    category_ambiguous: "no",
    name_ambiguity: "high",
    address_mismatch: "high",
    category_mismatch: "no",
    possible_website_mismatch: "yes",
    phone_call_needed: "no",
    classification_reason: "Multiple branches and a different-city social presence do not clearly match the Geoapify row.",
  },
};

function classify(row) {
  if (
    row.website_status === "no_website_likely"
    && ["high", "medium"].includes(row.confidence)
    && row.branch_ambiguous === "no"
    && row.category_ambiguous === "no"
  ) {
    return "pitch_ready";
  }
  if (
    row.name_ambiguity === "high"
    || row.address_mismatch === "high"
    || row.category_mismatch === "yes"
    || row.possible_website_mismatch === "yes"
  ) {
    return "avoid_for_now";
  }
  if (
    row.website_status === "unclear"
    && ["medium", "low"].includes(row.confidence)
    && (row.branch_ambiguous === "yes"
      || row.address_mismatch !== "none"
      || row.phone_call_needed === "yes"
      || row.category_ambiguous === "yes")
  ) {
    return "manual_verification";
  }
  return "avoid_for_now";
}

const verificationText = await fs.readFile(verificationDownload, "utf8");
const verificationWorkbook = await Workbook.fromCSV(verificationText, { sheetName: "Verification" });
await verificationWorkbook.inspect({
  kind: "region",
  sheetId: "Verification",
  range: "A1:L20",
  maxChars: 3000,
  tableMaxRows: 10,
  tableMaxCols: 12,
});
await fs.writeFile(savedVerificationPath, verificationText, "utf8");

const verifiedGeoapify = parseCsv(await fs.readFile(verifiedGeoapifyPath, "utf8"));
const uniqueGeoapify = [];
const seenBusinessKeys = new Set();
for (const row of verifiedGeoapify.rows) {
  const key = exactBusinessKey(row);
  if (!seenBusinessKeys.has(key)) {
    seenBusinessKeys.add(key);
    uniqueGeoapify.push(row);
  }
}
await fs.writeFile(
  cleanedPath,
  serializeCsv(verifiedGeoapify.header, uniqueGeoapify),
  "utf8",
);

const cleanedText = await fs.readFile(cleanedPath, "utf8");
const cleanedWorkbook = await Workbook.fromCSV(cleanedText, { sheetName: "Geoapify" });
await cleanedWorkbook.inspect({
  kind: "region",
  sheetId: "Geoapify",
  range: "A1:L20",
  maxChars: 3000,
  tableMaxRows: 10,
  tableMaxCols: 12,
});

const cleaned = parseCsv(cleanedText);
const verification = parseCsv(verificationText);
const geoByName = new Map(cleaned.rows.map((row) => [normalizedName(row.name), row]));
const verificationByName = new Map(
  verification.rows.map((row) => [normalizedName(row.business_name), row]),
);
if (geoByName.size !== 8 || verificationByName.size !== 8) {
  throw new Error(`Expected 8 unique rows in each input; got Geoapify=${geoByName.size}, verification=${verificationByName.size}.`);
}

const finalColumns = [
  "name",
  "category",
  "address",
  "phone",
  "website",
  "opening_hours",
  "latitude",
  "longitude",
  "place_id",
  "source",
  "geoapify_website_status",
  "place_details_status",
  "verification_category",
  "searched_query",
  "official_website_found",
  "official_website_url",
  "social_presence",
  "listing_presence",
  "phone_found",
  "evidence_links",
  "evidence_quality",
  "website_status",
  "confidence",
  "notes",
  "branch_ambiguous",
  "category_ambiguous",
  "name_ambiguity",
  "address_mismatch",
  "category_mismatch",
  "possible_website_mismatch",
  "phone_call_needed",
  "lead_classification",
  "classification_reason",
];

const merged = [];
for (const [key, verificationRow] of verificationByName) {
  const geoRow = geoByName.get(key);
  const flags = reviewFlags[key];
  if (!geoRow) throw new Error(`No Geoapify match for ${verificationRow.business_name}.`);
  if (!flags) throw new Error(`No review flags for ${verificationRow.business_name}.`);
  const row = {
    name: geoRow.name,
    category: geoRow.category,
    address: geoRow.address,
    phone: geoRow.phone,
    website: geoRow.website,
    opening_hours: geoRow.opening_hours,
    latitude: geoRow.latitude,
    longitude: geoRow.longitude,
    place_id: geoRow.place_id,
    source: geoRow.source,
    geoapify_website_status: geoRow.website_status,
    place_details_status: geoRow.place_details_status,
    verification_category: verificationRow.category,
    searched_query: verificationRow.searched_query,
    official_website_found: verificationRow.official_website_found,
    official_website_url: verificationRow.official_website_url,
    social_presence: verificationRow.social_presence,
    listing_presence: verificationRow.listing_presence,
    phone_found: verificationRow.phone_found,
    evidence_links: verificationRow.evidence_links,
    evidence_quality: evidenceQuality(verificationRow.evidence_links),
    website_status: verificationRow.website_status,
    confidence: verificationRow.confidence,
    notes: verificationRow.notes,
    ...flags,
  };
  row.lead_classification = classify(row);
  merged.push(row);
}

if (merged.some((row) => row.website_status === "confirmed_no_website")) {
  throw new Error("confirmed_no_website is prohibited.");
}

const expected = {
  pitch_ready: ["RAJSHREE BOUTIQUE", "Desi Bhoj", "Rigveda'"],
  manual_verification: ["MAC Studio Unisex Salon", "Mandap Garden and Restaurant", "Dhanlakshmi Store"],
  avoid_for_now: ["KASHISH", "Brown Sugar"],
};
for (const [classification, names] of Object.entries(expected)) {
  for (const name of names) {
    const row = merged.find((candidate) => candidate.name === name);
    if (!row || row.lead_classification !== classification) {
      throw new Error(`Expected ${name} to be ${classification}.`);
    }
  }
}

function orderedSubset(classification) {
  const byName = new Map(merged.map((row) => [row.name, row]));
  return expected[classification].map((name) => byName.get(name));
}

const pitchReady = orderedSubset("pitch_ready");
const manual = orderedSubset("manual_verification");
const avoid = orderedSubset("avoid_for_now");
const finalOrdered = [...pitchReady, ...manual, ...avoid];

const outputs = [
  ["jodhpur_final_leads.csv", finalOrdered],
  ["jodhpur_pitch_ready_leads.csv", pitchReady],
  ["jodhpur_manual_verification.csv", manual],
  ["jodhpur_avoid_for_now.csv", avoid],
];
for (const [filename, rows] of outputs) {
  const csv = serializeCsv(finalColumns, rows);
  await fs.writeFile(path.join(processedDir, filename), csv, "utf8");
  const workbook = await Workbook.fromCSV(csv, { sheetName: "Leads" });
  const inspected = await workbook.inspect({
    kind: "region",
    sheetId: "Leads",
    range: `A1:AG${rows.length + 1}`,
    maxChars: 4000,
    tableMaxRows: rows.length + 1,
    tableMaxCols: finalColumns.length,
  });
  if (!inspected.ndjson.includes("lead_classification")) {
    throw new Error(`Artifact verification failed for ${filename}.`);
  }
}

const evidenceCounts = Object.groupBy(finalOrdered, (row) => row.evidence_quality);
const report = `# Final Lead Verification Report

## Summary

- Total leads: ${finalOrdered.length}
- Pitch-ready: ${pitchReady.length}
- Manual verification: ${manual.length}
- Avoid for now: ${avoid.length}

## Top 3 Recommended Businesses for Demo-Site Generation

1. RAJSHREE BOUTIQUE — high confidence and exact phone/address corroboration.
2. Desi Bhoj — medium confidence with matching location evidence.
3. Rigveda' — medium confidence with phone and local-listing corroboration.

## Evidence Quality Issues

- Strong evidence: ${(evidenceCounts.strong ?? []).length}
- Weak evidence: ${(evidenceCounts.weak ?? []).length}
- Missing evidence: ${(evidenceCounts.missing ?? []).length}
- All supplied evidence_links values are citation labels rather than full URLs, so every lead is marked evidence_quality = weak.
- Citation labels should be replaced with complete source URLs before outreach or demo-site generation.

## Classification Notes

- No lead is classified as confirmed_no_website.
- Pitch-ready rows use website_status = no_website_likely only.
- Dhanlakshmi Store remains manual verification because the category/address match is uncertain rather than confirmed mismatched.
- KASHISH and Brown Sugar are avoided because high name/address ambiguity or a possible mismatched web presence prevents a reliable row match.

## Demo-Site Generation

- Allowed now: No.
- Reason: The user explicitly requested that no websites be generated yet. The three pitch-ready leads are recommendations only.

## Input Provenance

- The supplied web-verification CSV was imported as data/processed/perplexity_web_verification.csv.
- The requested cleaned Geoapify CSV was absent, so data/processed/jodhpur_no_website_cleaned.csv was created from the verified Geoapify file by removing one exact duplicate MAC Studio identity row.
`;
await fs.writeFile(path.join(reportsDir, "final_lead_verification_report.md"), report, "utf8");

const previewColumns = [
  "name",
  "website_status",
  "confidence",
  "evidence_quality",
  "lead_classification",
  "classification_reason",
];
const previewWorkbook = Workbook.create();
const previewSheet = previewWorkbook.worksheets.add("Classification QA");
previewSheet.showGridLines = false;
previewSheet.getRange("A1:F9").values = [
  previewColumns,
  ...finalOrdered.map((row) => previewColumns.map((column) => row[column])),
];
previewSheet.getRange("A1:F1").format = {
  fill: "#1F4E78",
  font: { bold: true, color: "#FFFFFF" },
  rowHeight: 24,
};
previewSheet.getRange("A2:F9").format = {
  verticalAlignment: "top",
  wrapText: true,
};
previewSheet.getRange("A1:A9").format.columnWidth = 30;
previewSheet.getRange("B1:B9").format.columnWidth = 22;
previewSheet.getRange("C1:C9").format.columnWidth = 14;
previewSheet.getRange("D1:D9").format.columnWidth = 18;
previewSheet.getRange("E1:E9").format.columnWidth = 22;
previewSheet.getRange("F1:F9").format.columnWidth = 64;
previewSheet.getRange("A2:F9").format.rowHeight = 42;
const preview = await previewWorkbook.render({
  sheetName: "Classification QA",
  range: "A1:F9",
  scale: 1.2,
  format: "png",
});
await fs.writeFile(
  path.join(scriptDir, "final-leads-preview.png"),
  new Uint8Array(await preview.arrayBuffer()),
);

console.log(JSON.stringify({
  total: finalOrdered.length,
  pitch_ready: pitchReady.length,
  manual_verification: manual.length,
  avoid_for_now: avoid.length,
  evidence_quality: {
    strong: (evidenceCounts.strong ?? []).length,
    weak: (evidenceCounts.weak ?? []).length,
    missing: (evidenceCounts.missing ?? []).length,
  },
  demo_site_generation_allowed: false,
}));
process.exitCode = 0;
