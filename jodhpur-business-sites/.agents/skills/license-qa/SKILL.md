---
name: license-qa
description: Use this skill when checking whether a template, component, copied code, or downloaded UI asset is safe to use from a licensing and attribution perspective.
---

# License QA

## Goal

Check whether a template or UI asset is safe to use.

## Checks

- LICENSE file exists.
- License type is identified.
- Attribution requirement is identified.
- Premium/proprietary templates are rejected.
- Required attribution is preserved.
- Source URL is recorded.
- Unclear licenses are marked NEEDS REVIEW.

## Output

Create or update:

`reports/license_qa.md`

## Status

Use:

- PASS
- FAIL
- NEEDS REVIEW
