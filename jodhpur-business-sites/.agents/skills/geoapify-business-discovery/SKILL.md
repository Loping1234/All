---
name: geoapify-business-discovery
description: Use this skill when finding local businesses through Geoapify Places API and producing CSV files for lead generation. Use for prompts mentioning Geoapify, Jodhpur businesses, no-website businesses, business discovery, or lead CSV creation.
---

# Geoapify Business Discovery Skill

## Goal

Find local businesses using Geoapify Places API and produce structured CSV files.

## Inputs

- Location coordinates
- Business categories
- Search radius
- Result limit
- `.env` file containing `GEOAPIFY_API_KEY`

## Required security behavior

- Load API key from `process.env.GEOAPIFY_API_KEY`.
- Use `dotenv` if needed.
- Never print the API key.
- Never hardcode the API key.
- Never commit `.env`.

## Data source rules

- Use Geoapify only.
- Do not scrape Google Maps, Justdial, Zomato, Swiggy, Facebook, or Instagram.
- Do not guess missing websites.
- If website exists, set `website_status = has_website`.
- If website is missing, set `website_status = none`.
- If data is incomplete, set `website_status = unclear`.

## Output files

Create:

- `data/jodhpur_businesses.csv`
- `data/jodhpur_no_website.csv`

## Required CSV columns

- name
- category
- address
- phone
- website
- website_status
- latitude
- longitude
- source

## First-run limit

For the first run, process only 10 businesses total.

## Final summary

Report only:

- total businesses found
- has_website count
- none count
- unclear count
- output files created
