# Three-Site Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the three approved Jodhpur demo sites and their gallery as a cohesive premium portfolio using self-hosted Instrument fonts, distinct solid-color palettes, verified data, and responsive business-specific bento layouts.

**Architecture:** Keep the existing static HTML and CSS site structure. Add one shared self-hosted font asset directory, retain one independent stylesheet per business, and add a dedicated validator for the exact three-site redesign scope. Preserve route slugs, section anchors, verified CSV content, license notes, and owner placeholders.

**Tech Stack:** HTML5, CSS3, Node.js validation scripts, Fontsource Instrument Sans 5.2.8, Fontsource Instrument Serif 5.2.8, local Python static server, in-app Browser visual QA.

---

## File Map

**Create**

- `scripts/validate-redesign.js`: validates the exact three-site redesign contract.
- `sites/assets/fonts/fonts.css`: shared local font-face declarations.
- `sites/assets/fonts/LICENSES.md`: records Fontsource package versions and OFL licensing.
- `sites/assets/fonts/instrument-sans-400.woff2`: Instrument Sans regular.
- `sites/assets/fonts/instrument-sans-500.woff2`: Instrument Sans medium.
- `sites/assets/fonts/instrument-sans-600.woff2`: Instrument Sans semibold.
- `sites/assets/fonts/instrument-serif-400.woff2`: Instrument Serif regular.
- `sites/assets/fonts/instrument-serif-400-italic.woff2`: Instrument Serif italic.

**Modify**

- `package.json`: add font dependencies and `validate:redesign`.
- `sites/rajshree-boutique/index.html`: preserve data and IA, replace presentation structure with approved hero and four-cell bento.
- `sites/rajshree-boutique/style.css`: apply shared type system and cold-luxury palette.
- `sites/rajshree-boutique/README.md`: record redesign and font licensing.
- `sites/desi-bhoj/index.html`: preserve data and IA, replace presentation structure with approved hero and five-cell bento.
- `sites/desi-bhoj/style.css`: apply shared type system and cobalt palette.
- `sites/desi-bhoj/README.md`: record redesign and font licensing.
- `sites/rigveda/index.html`: preserve data and IA, replace presentation structure with approved hero and five-cell bento.
- `sites/rigveda/style.css`: apply shared type system and forest palette.
- `sites/rigveda/README.md`: record redesign and font licensing.
- `sites/index.html`: restyle the three-link gallery without adding sites.
- `reports/site_qa_report.md`: refresh data-safety results.
- `reports/license_qa_final.md`: add Instrument font provenance.
- `reports/visual_qa.md`: replace prior screenshots and findings with redesign QA.

## Task 1: Add the Redesign Contract Validator

**Files:**

- Create: `scripts/validate-redesign.js`
- Modify: `package.json`

- [ ] **Step 1: Add the failing redesign validator**

Create a validator that loads `data/processed/jodhpur_pitch_ready_leads.csv`, checks only the three approved names, and enforces the new design contract. The implementation must define this target map:

```js
const TARGETS = [
  { name: "RAJSHREE BOUTIQUE", slug: "rajshree-boutique", bentoCells: 4 },
  { name: "Desi Bhoj", slug: "desi-bhoj", bentoCells: 5 },
  { name: "Rigveda'", slug: "rigveda", bentoCells: 5 },
];
```

For each target, assert:

```js
assert(html.includes(row.name), `${target.slug}: name mismatch`);
assert(html.includes(row.category), `${target.slug}: category mismatch`);
assert(html.includes(row.address), `${target.slug}: address mismatch`);
assert(html.includes(row.latitude), `${target.slug}: latitude missing`);
assert(html.includes(row.longitude), `${target.slug}: longitude missing`);
assert(html.includes("Unofficial demo website draft."), `${target.slug}: disclaimer missing`);
assert(html.includes("[OWNER TO PROVIDE]"), `${target.slug}: owner placeholder missing`);
assert((html.match(/class="[^"]*bento-card/g) || []).length === target.bentoCells,
  `${target.slug}: expected ${target.bentoCells} bento cells`);
assert(html.includes("../assets/fonts/fonts.css"), `${target.slug}: local fonts missing`);
assert(!/linear-gradient|radial-gradient|conic-gradient/i.test(css), `${target.slug}: gradient found`);
assert(!/[\u2013\u2014]/.test(html), `${target.slug}: forbidden dash character found`);
assert(!/(testimonial|reservation|book now|₹\s*\d|rs\.?\s*\d|inr\s*\d)/i.test(html),
  `${target.slug}: unsupported commercial content found`);
```

Also assert the gallery contains exactly these three hrefs and no duplicate site links.

- [ ] **Step 2: Add the npm command**

Add this script without changing existing commands:

```json
"validate:redesign": "node scripts/validate-redesign.js"
```

- [ ] **Step 3: Run the validator to prove the old design fails**

Run:

```powershell
npm run validate:redesign
```

Expected: non-zero exit with at least one failure for missing shared fonts, incorrect bento-cell contracts, or existing gradients.

- [ ] **Step 4: Commit the validator**

```powershell
git add package.json scripts/validate-redesign.js
git commit -m "test: define three-site redesign contract"
```

## Task 2: Add Reproducible Self-Hosted Instrument Fonts

**Files:**

- Modify: `package.json`, `package-lock.json`
- Create: `sites/assets/fonts/fonts.css`
- Create: `sites/assets/fonts/LICENSES.md`
- Create: five WOFF2 files listed in the file map

- [ ] **Step 1: Install the verified Fontsource packages**

```powershell
npm install @fontsource/instrument-sans@5.2.8 @fontsource/instrument-serif@5.2.8
```

Expected: both dependencies appear in `package.json` and the lockfile. Registry metadata reports `OFL-1.1`.

- [ ] **Step 2: Copy only the required local font files**

```powershell
New-Item -ItemType Directory -Force sites/assets/fonts | Out-Null
Copy-Item node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff2 sites/assets/fonts/instrument-sans-400.woff2
Copy-Item node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-500-normal.woff2 sites/assets/fonts/instrument-sans-500.woff2
Copy-Item node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-600-normal.woff2 sites/assets/fonts/instrument-sans-600.woff2
Copy-Item node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2 sites/assets/fonts/instrument-serif-400.woff2
Copy-Item node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2 sites/assets/fonts/instrument-serif-400-italic.woff2
```

- [ ] **Step 3: Define the shared font faces**

Create `sites/assets/fonts/fonts.css` with five `@font-face` rules using `font-display: swap`. Use `Instrument Sans` for weights 400, 500, and 600, and `Instrument Serif` for normal and italic weight 400.

```css
@font-face {
  font-family: "Instrument Sans";
  src: url("instrument-sans-400.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Instrument Serif";
  src: url("instrument-serif-400.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
```

Repeat the same complete declaration pattern for the remaining three files with their matching family, weight, and style.

- [ ] **Step 4: Record licensing**

Create `sites/assets/fonts/LICENSES.md` containing package names, pinned version `5.2.8`, license `OFL-1.1`, and `https://fontsource.org/fonts/instrument-sans` plus `https://fontsource.org/fonts/instrument-serif`.

- [ ] **Step 5: Verify local assets**

```powershell
Get-ChildItem sites/assets/fonts
```

Expected: `fonts.css`, `LICENSES.md`, and exactly five WOFF2 files.

- [ ] **Step 6: Commit font assets**

```powershell
git add package.json package-lock.json sites/assets/fonts
git commit -m "feat: self-host Instrument font family"
```

## Task 3: Redesign RAJSHREE BOUTIQUE

**Files:**

- Modify: `sites/rajshree-boutique/index.html`
- Modify: `sites/rajshree-boutique/style.css`
- Modify: `sites/rajshree-boutique/README.md`

- [ ] **Step 1: Replace the page composition while preserving content contracts**

Keep `#top`, `#information`, and `#visit`. Link `../assets/fonts/fonts.css` before `style.css`. The hero contains only category, H1, verified summary, Call, and View details. The bento contains exactly four `.bento-card` articles:

```html
<section class="bento" id="information" aria-labelledby="information-title">
  <div class="section-heading">
    <h2 id="information-title">Business information</h2>
    <p>Verified details and owner-supplied content areas.</p>
  </div>
  <div class="bento-grid">
    <article class="bento-card bento-card-media"><h3>Business photography</h3><p>[OWNER TO PROVIDE]</p></article>
    <article class="bento-card bento-card-logo"><h3>Official logo</h3><p>[OWNER TO PROVIDE]</p></article>
    <article class="bento-card bento-card-list"><h3>Product list</h3><p>[OWNER TO PROVIDE]</p></article>
    <article class="bento-card bento-card-hours"><h3>Opening hours</h3><p>Mo-Su 08:00-22:00</p></article>
  </div>
</section>
```

- [ ] **Step 2: Replace CSS with the approved shared system variant**

Start with these page tokens and use them across every section:

```css
:root {
  color-scheme: light dark;
  --page: #eef0f3;
  --surface: #f7f7f8;
  --surface-strong: #d9dde3;
  --ink: #202126;
  --muted: #60646d;
  --line: #c4c9d0;
  --accent: #76384f;
  --accent-ink: #f8f3f5;
  --radius: 16px;
}

body { font-family: "Instrument Sans", Arial, sans-serif; }
h1, h2, h3 { font-family: "Instrument Serif", Georgia, serif; font-weight: 400; }
```

Use a two-column hero above 768px, an asymmetric `1.35fr 0.65fr` bento, pill buttons, no gradients, and explicit single-column mobile fallbacks. Add a dark token override using charcoal surfaces and the same berry accent family.

- [ ] **Step 3: Update documentation**

Append a “Premium redesign” section to the README recording the shared design system, font source, OFL license, and preservation of the one-off Tooplate restriction.

- [ ] **Step 4: Run the focused contract check**

```powershell
npm run validate:redesign
```

Expected: RAJSHREE-specific assertions pass. Other sites may still fail until Tasks 4 and 5.

- [ ] **Step 5: Commit**

```powershell
git add sites/rajshree-boutique
git commit -m "feat: redesign Rajshree Boutique demo"
```

## Task 4: Redesign Desi Bhoj

**Files:**

- Modify: `sites/desi-bhoj/index.html`
- Modify: `sites/desi-bhoj/style.css`
- Modify: `sites/desi-bhoj/README.md`

- [ ] **Step 1: Preserve anchors and build the exact five-cell bento**

Keep `#menu` and `#visit`. Link the shared font CSS. Use five `.bento-card` articles for Photos, Menu information, Official logo, Phone, and Opening hours. Every value remains `[OWNER TO PROVIDE]` because these fields are absent from the verified row.

```html
<article class="bento-card bento-card-phone">
  <h3>Phone</h3>
  <p>[OWNER TO PROVIDE]</p>
</article>
<article class="bento-card bento-card-hours">
  <h3>Opening hours</h3>
  <p>[OWNER TO PROVIDE]</p>
</article>
```

- [ ] **Step 2: Apply the cobalt system variant**

```css
:root {
  color-scheme: light dark;
  --page: #f3f1eb;
  --surface: #faf9f5;
  --surface-strong: #dfe5ef;
  --ink: #24262c;
  --muted: #61646c;
  --line: #cbc9c2;
  --accent: #2456a6;
  --accent-ink: #f5f7fb;
  --radius: 16px;
}
```

Use Instrument Serif headings, Instrument Sans body text, an asymmetric split hero, a `1.2fr 0.8fr` bento rhythm, pill CTAs, solid backgrounds only, and explicit mobile collapse below 768px. Dark mode keeps cobalt as the single accent.

- [ ] **Step 3: Update README and run focused validation**

Record the shared font license and TemplateMo source note, then run `npm run validate:redesign`. Desi-specific assertions must pass.

- [ ] **Step 4: Commit**

```powershell
git add sites/desi-bhoj
git commit -m "feat: redesign Desi Bhoj demo"
```

## Task 5: Redesign Rigveda'

**Files:**

- Modify: `sites/rigveda/index.html`
- Modify: `sites/rigveda/style.css`
- Modify: `sites/rigveda/README.md`

- [ ] **Step 1: Preserve anchors and build the exact five-cell bento**

Keep `#top`, `#details`, `#menu`, and `#visit`. Link shared font CSS. Use five `.bento-card` articles for Business photos, Menu and service details, Official logo, Phone, and Opening hours. Missing values remain `[OWNER TO PROVIDE]`.

- [ ] **Step 2: Apply the forest system variant**

```css
:root {
  color-scheme: light dark;
  --page: #e9ece8;
  --surface: #f4f5f2;
  --surface-strong: #cfd8d0;
  --ink: #202722;
  --muted: #59635d;
  --line: #bdc6bf;
  --accent: #285c3f;
  --accent-ink: #f2f6f3;
  --radius: 16px;
}
```

Use a `0.9fr 1.1fr` split hero, a composed five-cell bento with one wide media cell, pill CTAs, no gradients, and a dark-mode forest palette. Collapse every grid to one column below 768px.

- [ ] **Step 3: Update README and run the complete validator**

Record the shared font license and Tooplate one-off restriction. Run:

```powershell
npm run validate:redesign
```

Expected: PASS for all three sites except the gallery assertion, if the gallery has not yet been updated.

- [ ] **Step 4: Commit**

```powershell
git add sites/rigveda
git commit -m "feat: redesign Rigveda demo"
```

## Task 6: Redesign the Gallery and Refresh Documentation

**Files:**

- Modify: `sites/index.html`
- Modify: three site README files if font details need correction
- Modify: `reports/license_qa_final.md`

- [ ] **Step 1: Replace the gallery presentation**

Link `assets/fonts/fonts.css`. Use Instrument Serif for the H1 and card titles, Instrument Sans for all other text, a neutral monochrome palette, 16px card radii, pill links, and exactly these links:

```html
<a href="rajshree-boutique/index.html">Open RAJSHREE BOUTIQUE</a>
<a href="desi-bhoj/index.html">Open Desi Bhoj</a>
<a href="rigveda/index.html">Open Rigveda'</a>
```

Use an asymmetric one-large-plus-two-stacked composition on desktop and a single column below 768px. Do not add status badges, gradients, or links to existing unrelated folders.

- [ ] **Step 2: Update final license QA**

Add Fontsource package names, version 5.2.8, OFL-1.1, local asset path, and confirmation that template package restrictions are unchanged.

- [ ] **Step 3: Run complete static validation**

```powershell
npm run validate:redesign
```

Expected: `PASS: 3 redesigned sites and gallery validated.`

- [ ] **Step 4: Commit**

```powershell
git add sites/index.html sites/*/README.md reports/license_qa_final.md
git commit -m "feat: unify demo gallery and license notes"
```

## Task 7: Run Data, Browser, and Visual QA

**Files:**

- Modify: `reports/site_qa_report.md`
- Modify: `reports/visual_qa.md`

- [ ] **Step 1: Start a local preview server**

```powershell
Start-Process python -ArgumentList '-m','http.server','4173','--directory','sites' -WindowStyle Hidden
```

Verify `http://127.0.0.1:4173/` returns HTTP 200.

- [ ] **Step 2: Run Browser desktop QA**

Open the gallery and each site at the normal viewport. For every page, verify title, H1, disclaimer, exact bento-cell count, CTA visibility, local font loading, no horizontal overflow, and no local console warnings or errors.

- [ ] **Step 3: Run Browser mobile QA**

Set a 390 x 844 viewport. Recheck all four pages for navigation fit, hero line count, CTA wrapping, bento collapse, readable placeholders, and horizontal overflow. Reset the viewport after the checks.

- [ ] **Step 4: Inspect screenshots against the approved reference**

Capture desktop and mobile screenshots. Use `view_image` on the accepted reference and the latest implementation screenshots in the same QA pass. Record at least these six comparison points:

1. Instrument Serif and Instrument Sans hierarchy.
2. Premium solid-color palette with no gradients.
3. Asymmetric first-viewport balance.
4. Bento rhythm and exact cell count.
5. Placeholder treatment without invented imagery.
6. Mobile single-column collapse.

- [ ] **Step 5: Run safety and copy audits**

```powershell
npm run validate:redesign
rg -n "testimonial|reservation|book now|₹[0-9]|Rs\.? [0-9]|INR [0-9]|[\u2013\u2014]" sites/rajshree-boutique sites/desi-bhoj sites/rigveda
```

Expected: validator PASS and ripgrep returns no unsupported visible content.

- [ ] **Step 6: Update QA reports**

`reports/site_qa_report.md` must report three checked sites, zero failures, RAJSHREE as PASS, and Desi Bhoj plus Rigveda' as NEEDS REVIEW only because phone and hours remain missing.

`reports/visual_qa.md` must include tested viewports, light/dark findings, Browser console results, screenshot comparison ledger, corrections made, and any intentional deviations.

- [ ] **Step 7: Run final verification and commit reports**

```powershell
npm run validate:redesign
git diff --check
git status --short
```

Expected: validation exits 0, `git diff --check` reports no whitespace errors, and status contains only intentional redesign changes.

```powershell
git add reports/site_qa_report.md reports/visual_qa.md
git commit -m "test: document premium redesign QA"
```

## Final Pre-Flight

- [ ] The shared font files load locally and their OFL provenance is documented.
- [ ] Every page has one locked palette and one accent color.
- [ ] No page CSS contains a gradient declaration.
- [ ] No page contains em-dash or en-dash characters.
- [ ] Every hero fits the first desktop viewport with visible CTA.
- [ ] Every navigation remains on one line at desktop.
- [ ] Each bento contains exactly the approved content cells and no empty tile.
- [ ] All multi-column sections explicitly collapse below 768px.
- [ ] Both color schemes retain readable contrast.
- [ ] No fabricated business content or unsupported functionality appears.
- [ ] The gallery links exactly three approved demos.
- [ ] Static validation, Browser QA, and screenshot comparison all pass.
