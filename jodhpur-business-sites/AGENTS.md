# Jodhpur Business Website Generator

## Security

- Read Geoapify key only from `.env`.
- Use `process.env.GEOAPIFY_API_KEY`.
- Never print the API key.
- Never hardcode the API key.
- Never commit `.env`.

## Data rules

- Use Geoapify API data only.
- Do not scrape Google Maps, Justdial, Zomato, Swiggy, or Instagram.
- Do not guess website URLs.
- If website is missing, mark `website_status = none`.
- If website exists, mark `website_status = has_website`.
- If unclear, mark `website_status = unclear`.

## Website rules

- Generated websites are unofficial demo drafts.
- Every generated site must show: “Unofficial demo website draft.”
- Do not invent timings, menus, prices, reviews, owner names, photos, or claims.
- Missing data must be shown as `[OWNER TO PROVIDE]`.

## Subagent rules

- Use subagents only for bounded parallel work.
- For site generation, spawn one subagent per business row.
- Process only 5 businesses in the first batch.
- Each subagent must work in its own site folder.
- Each subagent must return:
  - files created
  - real fields used
  - placeholders added
  - any missing data
- After site generation, spawn one QA subagent to review all generated sites against the CSV.

## External template browsing

- Use Browser only for approved template websites.
- Do not browse random websites for templates.
- Do not copy code before license checking.
- First create `reports/template_shortlist.md`.
- Then run license QA.
- Only approved templates may be copied into `/templates`.
- Prefer professional, restrained layouts over flashy/noisy designs.
- Reject templates that are too basic, too generic, cluttered, outdated, or animation-heavy.

## Design Taste Skill Rules

- Use `design-taste-frontend` only for frontend visual quality, layout refinement, typography, spacing, responsiveness, and anti-generic polish.
- Do not use it for lead discovery, business verification, CSV processing, scraping, or data classification.
- Do not let it invent business content.
- Do not let it replace approved templates unless explicitly instructed.
- Preserve the selected template’s structure and license requirements.
- Do not add fake menus, prices, reviews, testimonials, opening hours, team members, photos, or claims.
- Missing business information must remain `[OWNER TO PROVIDE]`.
- Every generated page must visibly show: `Unofficial demo website draft`.
- For this project, use it after adapting approved templates and before visual QA.