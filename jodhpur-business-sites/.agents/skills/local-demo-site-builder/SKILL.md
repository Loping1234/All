---
name: local-demo-site-builder
description: Use this skill when generating unofficial demo websites for local businesses from a CSV row. Use for prompts mentioning starter sites, demo websites, business landing pages, site generation, or one site per business.
---

# Local Demo Site Builder Skill

## Goal

Generate one unofficial demo website for each business row.

## Input

Use rows from:

`data/jodhpur_no_website.csv`

## Subagent behavior

- Spawn one subagent per business row.
- Process only 5 businesses in the first batch.
- Each subagent must work only inside its own folder.

## Output structure

For each business:

`sites/{slug}/index.html`

`sites/{slug}/style.css`

## Required page sections

Each site must include:

- business name
- category
- address
- phone if available
- map link using latitude and longitude
- placeholder for logo
- placeholder for photos
- placeholder for menu or services
- placeholder for opening hours
- visible disclaimer: `Unofficial demo website draft`

## Strict content rules

- Do not invent menu items.
- Do not invent prices.
- Do not invent opening hours.
- Do not invent reviews.
- Do not invent photos.
- Do not invent owner names.
- Do not claim the site is official.
- Missing data must be shown as `[OWNER TO PROVIDE]`.

## Final summary per site

Each subagent must report:

- folder created
- fields used from CSV
- placeholders added
- missing data
