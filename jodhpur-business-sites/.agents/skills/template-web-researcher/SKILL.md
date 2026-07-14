---
name: template-web-researcher
description: Use this skill when browsing public template websites to find professional templates that match a project type, industry, visual style, and license requirement.
---

# Template Web Researcher

## Goal

Browse approved public template websites and shortlist suitable templates.

## Approved sources

Use only these unless the user explicitly adds more:

- colorlib.com
- startbootstrap.com
- themewagon.com
- flowbite.com
- vercel.com/templates
- ui.shadcn.com
- registry.directory
- bootstrapmade.com
- html5up.net

## Search objective

Find templates that are:

- professional
- not too simple
- not visually noisy
- responsive
- suitable for the requested industry/use case
- preferably free or open-source
- license-safe for demo/client use

## Scoring rubric

Score each template from 0 to 10.

Criteria:

1. Industry fit
2. Visual professionalism
3. Layout clarity
4. Mobile responsiveness
5. Adaptation effort
6. Code quality
7. License safety
8. Suitability for real client/demo use

## Output

Create:

`reports/template_shortlist.md`

For each shortlisted template include:

- template name
- source website
- category
- stack
- live preview availability
- license status
- attribution requirement
- score out of 10
- why selected
- risks
- whether safe to copy/adapt

## Rules

- Do not download or copy a template until license is checked.
- Do not use templates with unclear license.
- Do not remove attribution if required.
- Do not use premium templates unless the user says they have purchased them.
- Do not select visually noisy templates.
- Prefer clean business-grade layouts.
