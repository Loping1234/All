---
name: demo-site-qa
description: Use this skill when reviewing generated local business demo websites against source CSV data. Use for QA, checking fabricated facts, missing disclaimers, broken links, or placeholder compliance.
---

# Demo Site QA Skill

## Goal

Check generated demo websites against the source CSV and flag unsafe or fabricated content.

## Inputs

- `data/jodhpur_no_website.csv`
- generated site folders inside `sites/`

## QA checks

For every generated site, check:

- business name matches CSV
- category matches CSV
- address matches CSV
- phone matches CSV if present
- map link uses correct latitude and longitude
- visible disclaimer exists: `Unofficial demo website draft`
- missing logo/photos/menu/hours are marked as placeholders
- no invented menu items
- no invented prices
- no invented reviews
- no invented opening hours
- no claim that the site is official

## Output

Create:

`reports/site_qa_report.md`

## Status rules

Use:

- `PASS` if no fabricated content and required disclaimer/placeholders exist.
- `FAIL` if any invented fact, missing disclaimer, or serious mismatch exists.
- `NEEDS REVIEW` if source data is incomplete.

## Final summary

Report:

- total sites checked
- PASS count
- FAIL count
- NEEDS REVIEW count
- exact files needing correction
