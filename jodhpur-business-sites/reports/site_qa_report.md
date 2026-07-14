# Demo Site QA Report

QA date: 2026-07-09
Source of truth: `data/processed/jodhpur_pitch_ready_leads.csv` for the first three sites; user-supplied 15 A.D. research attachment for the fourth owner-verification draft.
Scope: Four unofficial demo drafts.

## Summary

| Result | Count |
|---|---:|
| PASS | 1 |
| FAIL | 0 |
| NEEDS REVIEW | 3 |

Source-safety checks completed with 0 fabrication failures. The review flags below are owner-data gaps or branch conflicts, not defects in the generated files.

## Site Results

### RAJSHREE BOUTIQUE - PASS

- Verified name, category, address, phone, opening hours, coordinates, website status, confidence, and evidence quality match the CSV row.
- The exact disclaimer `Unofficial demo website draft.` is visible.
- Missing logo, photography, and product information are shown as `[OWNER TO PROVIDE]`.
- No invented products, prices, reviews, staff, booking flow, social profiles, or claims were found.
- Map and telephone links use only verified values.

### Desi Bhoj - NEEDS REVIEW

- Verified name, category, address, coordinates, website status, confidence, and evidence quality match the CSV row.
- The exact disclaimer is visible.
- Phone, opening hours, logo, photography, and menu information are correctly shown as `[OWNER TO PROVIDE]`.
- No invented menu items, prices, reviews, staff, booking flow, social profiles, or claims were found.
- Owner verification is still required because the source row contains no phone or opening hours.

### Rigveda' - NEEDS REVIEW

- Verified name, category, address, coordinates, website status, confidence, and evidence quality match the CSV row.
- The exact disclaimer is visible.
- Phone, opening hours, logo, photography, and menu information are correctly shown as `[OWNER TO PROVIDE]`.
- No invented menu items, prices, reviews, staff, booking flow, social profiles, or claims were found.
- Owner verification is still required because the source row contains no phone or opening hours.

### 15 A.D. Bakery - NEEDS REVIEW

- Business name, category, and outlet notes were inserted from the user-supplied 2026-07-09 research attachment.
- The exact disclaimer is visible.
- Logo, photos, menu/products, opening hours, WhatsApp/email, map coordinates, and active website are shown as `[OWNER TO PROVIDE]`.
- No invented products, prices, reviews, staff, booking flow, ordering flow, photos, or opening hours were found.
- The page clearly marks the Ratanada address conflict and the Paota brand-match question as requiring a phone call before publishing.
- Owner verification is required because this brand is not in the original pitch-ready CSV and the supplied research has unresolved branch conflicts.

## Gallery

`sites/index.html` links to the four current drafts and repeats the unofficial-demo warning.

## Corrections Required

None. Desi Bhoj, Rigveda', and 15 A.D. Bakery remain marked NEEDS REVIEW until the owner supplies or verifies the missing business details.
