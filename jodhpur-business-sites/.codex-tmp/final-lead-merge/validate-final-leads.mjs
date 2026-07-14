import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parseCsv } from "../../scripts/validate-leads.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../..");
const processed = path.join(root, "data", "processed");

async function load(filename) {
  return parseCsv(await fs.readFile(path.join(processed, filename), "utf8"));
}

const final = await load("jodhpur_final_leads.csv");
const pitch = await load("jodhpur_pitch_ready_leads.csv");
const manual = await load("jodhpur_manual_verification.csv");
const avoid = await load("jodhpur_avoid_for_now.csv");
const cleaned = await load("jodhpur_no_website_cleaned.csv");
const imported = await fs.readFile(path.join(processed, "perplexity_web_verification.csv"));
const download = await fs.readFile("C:/Users/PRANAY/Downloads/businessname-category-searchedquery-officialwebsit.csv");
const report = await fs.readFile(path.join(root, "reports", "final_lead_verification_report.md"), "utf8");

const expected = {
  pitch_ready: ["RAJSHREE BOUTIQUE", "Desi Bhoj", "Rigveda'"],
  manual_verification: ["MAC Studio Unisex Salon", "Mandap Garden and Restaurant", "Dhanlakshmi Store"],
  avoid_for_now: ["KASHISH", "Brown Sugar"],
};
const actualNames = (rows) => rows.map((row) => row.name);
for (const [classification, names] of Object.entries(expected)) {
  const rows = classification === "pitch_ready" ? pitch.rows
    : classification === "manual_verification" ? manual.rows
      : avoid.rows;
  if (JSON.stringify(actualNames(rows)) !== JSON.stringify(names)) {
    throw new Error(`Unexpected ${classification} businesses.`);
  }
  if (rows.some((row) => row.lead_classification !== classification)) {
    throw new Error(`Invalid classification value in ${classification}.`);
  }
}

if (final.rows.length !== 8 || cleaned.rows.length !== 8) throw new Error("Expected 8 final and cleaned rows.");
if (pitch.rows.length !== 3 || manual.rows.length !== 3 || avoid.rows.length !== 2) {
  throw new Error("Classification counts do not match 3/3/2.");
}
if (new Set(final.rows.map((row) => row.place_id)).size !== final.rows.length) {
  throw new Error("Duplicate place_id found in final leads.");
}
if (final.rows.some((row) => row.website_status === "confirmed_no_website")) {
  throw new Error("confirmed_no_website found.");
}
if (pitch.rows.some((row) => row.website_status !== "no_website_likely")) {
  throw new Error("Pitch-ready status is not no_website_likely.");
}
if (!final.header.includes("evidence_quality")) throw new Error("evidence_quality column missing.");
const evidence = Object.groupBy(final.rows, (row) => row.evidence_quality);
if ((evidence.weak ?? []).length !== 8 || (evidence.strong ?? []).length || (evidence.missing ?? []).length) {
  throw new Error("Unexpected evidence quality counts.");
}
if (final.rows.some((row) => /https?:\/\//i.test(row.evidence_links))) {
  throw new Error("A full URL was found but evidence was not marked strong.");
}
const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
if (digest(imported) !== digest(download)) throw new Error("Imported verification file differs from source.");
for (const text of ["Total leads: 8", "Pitch-ready: 3", "Manual verification: 3", "Avoid for now: 2", "Allowed now: No"]) {
  if (!report.includes(text)) throw new Error(`Report missing: ${text}`);
}

console.log(JSON.stringify({
  total_leads: final.rows.length,
  pitch_ready: pitch.rows.length,
  manual_verification: manual.rows.length,
  avoid_for_now: avoid.rows.length,
  evidence_quality: { strong: 0, weak: 8, missing: 0 },
  imported_file_matches_source: true,
  duplicate_place_ids: 0,
  confirmed_no_website: 0,
  demo_site_generation_allowed: false,
}));
