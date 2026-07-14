# Three-Site Premium Redesign Specification

Date: 2026-07-07  
Status: Approved visual direction, pending written-spec review  
Reference: `C:\Users\PRANAY\AppData\Local\Temp\codex-clipboard-33e5dfea-c6e5-4da0-a860-5f07e33f0e03.png`

## Objective

Redesign the three existing unofficial Jodhpur business demo sites as a cohesive portfolio. The sites will share a premium minimal design system while retaining distinct business-specific palettes and layouts.

The redesign covers:

- RAJSHREE BOUTIQUE
- Desi Bhoj
- Rigveda'

It does not add businesses, public deployment, outreach, booking, ecommerce, menus, pricing, testimonials, or unsupported claims.

## Design Read

Reading this as three trust-first local-business landing pages for prospective owners, with a premium minimal and editorial language, leaning toward native HTML and CSS, Instrument typography, restrained solid palettes, asymmetric heroes, and content-led bento layouts.

Design dials:

- `DESIGN_VARIANCE: 6` for composed asymmetry without experimental navigation.
- `MOTION_INTENSITY: 3` for hover, focus, and active feedback only.
- `VISUAL_DENSITY: 3` for generous spacing and a gallery-like reading rhythm.

## Chosen Approach

Use one shared design system with three palette and composition variants.

This was selected over:

1. A template-preserving facelift, which would retain too much visual inconsistency.
2. Three unrelated identities, which would weaken the portfolio as a coherent set.

## Existing-Site Audit

### Information architecture

Each site is a single static HTML page with section anchors, a primary navigation, verified listing information, placeholders, a location link, a disclaimer, and a footer. Route slugs and anchor destinations will remain stable.

### Current visual tokens

- RAJSHREE BOUTIQUE uses a sharp editorial layout, sans-serif typography, grey surfaces, and a muted red accent.
- Desi Bhoj uses a bright restaurant layout, coral surfaces, and rounded cards.
- Rigveda' uses warm cafe colors, mixed serif and sans-serif typography, and rounded panels.

### Content doing useful work

- Verified business name, category, address, phone, opening hours, coordinates, website status, confidence, and evidence quality.
- Explicit `[OWNER TO PROVIDE]` markers for missing content.
- Visible “Unofficial demo website draft.” disclosure.
- OpenStreetMap and verified telephone links where available.
- Source and license documentation in each README and HTML comment.

### Patterns to preserve

- Existing route slugs and section anchors.
- Current navigation labels unless a label must be shortened to prevent wrapping.
- Exact verified business data.
- Disclaimer language and placeholder convention.
- Keyboard focus visibility and responsive single-column fallbacks.
- Template source and license notes.

### Patterns to retire

- Inconsistent type systems between sites.
- Gradient backgrounds.
- Large empty placeholder areas that dominate the first viewport.
- Generic equal-card grids.
- Mid-word headline wrapping.
- Theme behavior that changes the intended brand expression unpredictably.

### SEO baseline

Keep existing page titles, descriptions, route slugs, heading semantics, and business-name H1 elements. No structured-data claims will be added without verified source fields.

## Shared Design System

### Stack

Keep the current static HTML and CSS architecture. No JavaScript framework or new runtime dependency is needed. Each site continues to contain `index.html`, `style.css`, and `README.md`.

### Typography

- Titles and major headings: Instrument Serif.
- Navigation, body text, labels, buttons, and metadata: Instrument Sans.
- Fonts will be self-hosted as WOFF2 files with `font-display: swap` from a verified licensed source.
- System serif and sans-serif fallbacks will prevent invisible text if font files fail.
- No third-party font CDN will be required at runtime.

### Shape system

- Bento cells and content panels: 16px radius.
- Buttons: full-pill treatment.
- Small data chips are not used.
- Placeholder media frames follow the same 16px radius.

### Theme system

Each page uses semantic CSS variables and respects `prefers-color-scheme`.

- One coherent palette is maintained per page.
- Dark mode preserves the same accent and hierarchy.
- No section-level theme inversion is used.
- No pure black or pure white is used.

### Motion

- Button and link hover transitions communicate interactivity.
- Active states use a small downward movement.
- No automatic entrance animation, marquee, parallax, or scroll hijacking.
- Reduced-motion users receive immediate state changes.

### Accessibility

- WCAG AA contrast for body text and controls.
- Visible focus rings.
- Semantic headings and landmarks.
- Minimum comfortable touch targets.
- No CTA label wrapping on desktop.
- No horizontal overflow at mobile widths.

## Business-Specific Directions

### RAJSHREE BOUTIQUE

Palette: cold-luxury pearl grey, graphite, and one restrained deep-berry accent.

Composition:

1. Asymmetric split hero with business name, verified category, concise verified-listing description, Call CTA, and View details CTA.
2. Four-cell bento using exact available content: photography placeholder, logo placeholder, product-list placeholder, and verified opening-hours panel.
3. Verified business-details section with address, phone, category, coordinates, and listing status.
4. Location CTA and compact footer.

The page remains fashion-editorial without inventing products, collections, promotions, or imagery.

### Desi Bhoj

Palette: soft ivory, charcoal, and one controlled cobalt accent.

Composition:

1. Asymmetric hero with business name, verified category, Basni location text, and View details CTA.
2. Five-cell restaurant bento using exact content: photo placeholder, menu placeholder, logo placeholder, phone placeholder, and opening-hours placeholder.
3. Verified address and coordinate panel.
4. Owner-confirmation section for missing details.
5. Location CTA and compact footer.

The page will not contain dishes, prices, cuisine claims, reservations, delivery claims, or food photography.

### Rigveda'

Palette: mineral stone, near-black green, and one deep-forest accent.

Composition:

1. Asymmetric cafe hero with business name, verified category, verified-listing description, and Open map CTA.
2. Five-cell bento using exact content: business-photo placeholder, menu placeholder, logo placeholder, phone placeholder, and opening-hours placeholder.
3. Verified business-details section.
4. Location section and compact footer.

The page will not contain drinks, prices, cafe atmosphere claims, staff, reviews, reservations, or invented photography.

## Content Rules

The only business facts allowed are fields from `data/processed/jodhpur_pitch_ready_leads.csv`.

- Missing information is rendered exactly as `[OWNER TO PROVIDE]`.
- The visible disclosure remains exactly “Unofficial demo website draft.”
- No `confirmed_no_website` wording is introduced.
- Evidence quality and confidence remain visible where currently present.
- No unverified social links, forms, WhatsApp links, or email addresses are added.
- The audio, transcription, testimonial, pricing, and post-conversion sections shown in the reference text are not relevant and will not be implemented.

## Data Flow and Failure Handling

The pages remain static and have no runtime data fetch.

- Verified data is copied from the approved CSV into semantic HTML.
- Missing data maps to owner placeholders.
- If a local font fails, the fallback stack preserves layout and readability.
- If an external map cannot open, the verified address and coordinates remain visible as text.
- No form or booking error state is needed because no form or booking behavior exists.

## Gallery

`sites/index.html` will be restyled to use the same shared typography and neutral portfolio language. It will retain exactly three cards and links, one for each requested business. No additional existing site folder will be linked.

## Verification Plan

### Data and safety QA

- Compare every visible fact with `data/processed/jodhpur_pitch_ready_leads.csv`.
- Confirm exact disclaimer text.
- Confirm placeholders for every missing owner field.
- Scan for invented menus, products, prices, reviews, hours, staff, images, booking, and official-site claims.
- Re-run `npm run validate:sites` and `npm run qa` if compatible with the three-site scope.

### Visual QA

- Render gallery and all three sites in the in-app Browser.
- Inspect desktop and 390 x 844 mobile widths.
- Inspect both light and dark color schemes where browser controls permit.
- Compare the implementation screenshots with the accepted reference for typography, palette restraint, asymmetric layout, bento rhythm, spacing, and responsive collapse.
- Verify hero content and CTA remain visible in the first desktop viewport.
- Verify no mid-word heading breaks or horizontal overflow.

### License QA

- Keep existing template source and terms notes in every README and HTML comment.
- Do not download, bundle, or redistribute original template packages.
- Record the redesign as a one-off end-site adaptation.
- Record the Instrument font source and license when the font files are added.

## Acceptance Criteria

The redesign is acceptable when:

1. All three pages visibly belong to one portfolio design system.
2. Each business remains visually distinct through one controlled accent palette and a tailored bento composition.
3. Instrument Serif and Instrument Sans are self-hosted and used as specified.
4. No gradients, fabricated facts, stock photos, pricing, testimonials, or unsupported interactions appear.
5. The first viewport is balanced and complete at desktop size.
6. Every multi-column section collapses cleanly below 768px.
7. Data QA, license QA, and rendered visual QA report no unresolved code defects.
8. Desi Bhoj and Rigveda' may remain NEEDS REVIEW only for genuinely missing owner data.
