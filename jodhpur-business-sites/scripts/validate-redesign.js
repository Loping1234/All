import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TARGETS = [
  { name: "RAJSHREE BOUTIQUE", slug: "rajshree-boutique", bentoCells: 4 },
  { name: "Desi Bhoj", slug: "desi-bhoj", bentoCells: 5 },
  { name: "Rigveda'", slug: "rigveda", bentoCells: 5 },
];

const MANUAL_TARGETS = [
  {
    name: "15 A.D. Bakery",
    slug: "15-ad-bakery",
    bentoCells: 18,
    requiredText: [
      "15 A.D. Bakery",
      "Bakery",
      "Neelam Bhawan, 9th C Road, Sardarpura, Jodhpur 342003",
      "56, Street No. 4, Behind New Power House, Industrial Area, Jodhpur 342003",
      "Ratanada has conflicting address records",
      "[OWNER TO PROVIDE]",
      "Unofficial demo website draft.",
    ],
  },
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [header, ...records] = rows;
  return records.map((record) => Object.fromEntries(
    header.map((column, index) => [column, record[index] ?? ""]),
  ));
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csv = await readFile(
  path.join(projectRoot, "data", "processed", "jodhpur_pitch_ready_leads.csv"),
  "utf8",
);
const leads = parseCsv(csv);
const failures = [];

function check(test, message) {
  try {
    assert(test, message);
  } catch {
    failures.push(message);
  }
}

for (const target of TARGETS) {
  const row = leads.find((lead) => lead.name === target.name);
  check(row, `${target.slug}: source row missing`);
  if (!row) continue;

  const siteDirectory = path.join(projectRoot, "sites", target.slug);
  const [html, css, readme] = await Promise.all([
    readFile(path.join(siteDirectory, "index.html"), "utf8"),
    readFile(path.join(siteDirectory, "style.css"), "utf8"),
    readFile(path.join(siteDirectory, "README.md"), "utf8"),
  ]);

  check(html.includes(row.name), `${target.slug}: name mismatch`);
  check(html.includes(row.category), `${target.slug}: category mismatch`);
  check(html.includes(row.address), `${target.slug}: address mismatch`);
  check(html.includes(row.latitude), `${target.slug}: latitude missing`);
  check(html.includes(row.longitude), `${target.slug}: longitude missing`);
  check(html.includes("Unofficial demo website draft."), `${target.slug}: disclaimer missing`);
  check(html.includes("[OWNER TO PROVIDE]"), `${target.slug}: owner placeholder missing`);
  check(
    (html.match(/class="[^"]*bento-card/g) || []).length === target.bentoCells,
    `${target.slug}: expected ${target.bentoCells} bento cells`,
  );
  check(html.includes("../assets/fonts/fonts.css"), `${target.slug}: local fonts missing`);
  check(!/linear-gradient|radial-gradient|conic-gradient/i.test(css), `${target.slug}: gradient found`);
  check(!/[\u2013\u2014]/.test(html), `${target.slug}: forbidden dash character found`);
  check(
    !/(testimonial|reservation|book now|₹\s*\d|rs\.?\s*\d|inr\s*\d)/i.test(html),
    `${target.slug}: unsupported commercial content found`,
  );
  check(readme.includes("OFL-1.1"), `${target.slug}: font license note missing`);

  if (row.phone) {
    check(html.includes(row.phone), `${target.slug}: verified phone missing`);
  }
  if (row.opening_hours) {
    check(html.includes(row.opening_hours), `${target.slug}: verified opening hours missing`);
  }
}

for (const target of MANUAL_TARGETS) {
  const siteDirectory = path.join(projectRoot, "sites", target.slug);
  const [html, css, readme] = await Promise.all([
    readFile(path.join(siteDirectory, "index.html"), "utf8"),
    readFile(path.join(siteDirectory, "style.css"), "utf8"),
    readFile(path.join(siteDirectory, "README.md"), "utf8"),
  ]);

  for (const expectedText of target.requiredText) {
    check(html.includes(expectedText), `${target.slug}: missing expected text "${expectedText}"`);
  }
  check(
    (html.match(/class="[^"]*bento-card/g) || []).length === target.bentoCells,
    `${target.slug}: expected ${target.bentoCells} bento cells`,
  );
  check(html.includes("../assets/fonts/fonts.css"), `${target.slug}: local fonts missing`);
  check(!/linear-gradient|radial-gradient|conic-gradient/i.test(css), `${target.slug}: gradient found`);
  check(!/[\u2013\u2014]/.test(html), `${target.slug}: forbidden dash character found`);
  check(
    !/(testimonial|reservation|book now|₹\s*\d|rs\.?\s*\d|inr\s*\d)/i.test(html),
    `${target.slug}: unsupported commercial content found`,
  );
  check(readme.includes("OFL-1.1"), `${target.slug}: font license note missing`);
  check(readme.includes("not part of the original"), `${target.slug}: source limitation note missing`);
}

const gallery = await readFile(path.join(projectRoot, "sites", "index.html"), "utf8");
const expectedLinks = [...TARGETS, ...MANUAL_TARGETS].map(({ slug }) => `${slug}/index.html`);
const gallerySiteLinks = [...gallery.matchAll(/href="([^"]+\/index\.html)"/g)]
  .map((match) => match[1]);
check(gallery.includes("assets/fonts/fonts.css"), "gallery: local fonts missing");
check(gallerySiteLinks.length === 4, "gallery: expected exactly 4 site links");
check(new Set(gallerySiteLinks).size === 4, "gallery: duplicate site link found");
for (const expectedLink of expectedLinks) {
  check(gallerySiteLinks.includes(expectedLink), `gallery: missing ${expectedLink}`);
}

if (failures.length > 0) {
  console.error(`Redesign validation failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("PASS: 4 redesigned sites and gallery validated.");
}
