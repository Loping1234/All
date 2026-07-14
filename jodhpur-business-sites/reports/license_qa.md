# Template License QA

Research date: 2026-07-07  
Scope: Final nine-template shortlist. No templates or code were downloaded.

| Template | Publisher | Status | Free | Attribution | License/terms | Key restriction |
|---|---|---:|---:|---|---|---|
| Barista Cafe | Tooplate | PASS | Yes | Not required | https://www.tooplate.com/about | Do not redistribute the template package |
| Klassy Cafe | TemplateMo | PASS | Yes | Not required | https://templatemo.com/about | Client adaptation allowed; use at own compatibility risk |
| Bistro Elegance | Tooplate | PASS | Yes | Not required | https://www.tooplate.com/about | Do not redistribute the template package |
| Little Fashion | Tooplate | PASS | Yes | Not required | https://www.tooplate.com/about | Do not redistribute the template package |
| Hexashop | TemplateMo | PASS | Yes | Not required | https://templatemo.com/about | Client adaptation allowed; use at own compatibility risk |
| Maison Doree | TemplateMo | PASS | Yes | Not required | https://templatemo.com/about | Client adaptation allowed; use at own compatibility risk |
| Waso Strategy | Tooplate | PASS | Yes | Not required | https://www.tooplate.com/about | Do not redistribute the template package |
| Agency | Start Bootstrap | PASS | Yes | MIT notice in source | https://startbootstrap.com/licenses | Retain copyright and MIT license notice with distributed source |
| Clean Work | Tooplate | PASS | Yes | Not required | https://www.tooplate.com/about | Do not redistribute the template package |

## Publisher Findings

### Tooplate — PASS

- Terms: https://www.tooplate.com/about
- Allows commercial and non-commercial website use and editing.
- Allows removal of the credit link; no backlink is required.
- Prohibits redistribution of the original template file as a template or template collection.
- Safe here only for a one-off adapted end site, not for republishing unchanged source packages in `/templates`.

### TemplateMo — PASS

- Terms: https://templatemo.com/about
- Templates are free and may be customized for clients.
- Charging for customization services is expressly allowed.
- Credit links may be removed.
- Compatibility and correctness are provided without warranty.

### Start Bootstrap — PASS

- License note: https://startbootstrap.com/licenses
- Publisher explanation: https://startbootstrap.com/about-us
- Free products use the MIT license.
- No visible footer credit is required.
- The MIT copyright and permission notice must remain with distributed source copies.

## Rejected / Not Approved

| Candidate/source | Status | Reason |
|---|---:|---|
| Kaira / ThemeWagon free tier | FAIL for this repository | Attribution is required and the generator/derivative-theme restriction conflicts with a website-generator workflow |
| BootstrapMade free tier | FAIL for client-site workflow | Current terms limit free use for client work and require retained footer credit; the paid license was not authorized |
| Premium Colorlib templates | FAIL | Premium templates are outside the approved scope |
| CSSCodex listings without exact terms | NEEDS REVIEW | Template-level reuse terms were not sufficiently clear |
| Wix, Canva, Nicepage, Figma Community | NEEDS REVIEW for copying | Visual inspiration is acceptable, but export/reuse rights were not clearer than the selected static templates |

## 15 A.D. Bakery Template License QA

Review date: 2026-07-13
Scope: additional user-approved template and inspiration sources. No assets or code were downloaded.

| Candidate | Source | Status | Cost | Attribution | License/terms | Key restriction |
|---|---|---:|---:|---|---|---|
| Zest | Framer Marketplace | PASS WITH CONDITIONS | Free | No public credit requirement stated; source record retained | https://www.framer.com/legal/community-terms/ | One-off broader end product only; no standalone redistribution, competing template, or ownership claim |
| Cakelab | Framer Marketplace | PASS WITH CONDITIONS | Free | No public credit requirement stated; source record retained | https://www.framer.com/legal/community-terms/ | Same Framer Limited Commercial License restrictions |
| Loafly | Framer Marketplace | PASS WITH CONDITIONS | Free | No public credit requirement stated; source record retained | https://www.framer.com/legal/community-terms/ | Same Framer Limited Commercial License restrictions |
| TAB Kitchen & Bakery | One Page Love reference | NEEDS REVIEW FOR REUSE | Not a template offer | Not applicable | No reuse license supplied on the reference page | Inspiration only; do not copy its code, imagery, identity, or trade dress |
| Dann Good Coffee | One Page Love / Webflow cloneable | NEEDS REVIEW FOR LOCAL COPYING | Free cloneable | Webflow badge remains on free publishing tier | https://onepagelove.com/dann-good-coffee | Webflow-platform template; no approval to extract or redistribute it as local static code |
| Webflow bakery search results | Webflow Marketplace | FAIL | Paid | Depends on item | Individual marketplace terms | Premium templates were not authorized or purchased |

### Framer free-content finding

Framer Community Terms section 7.3.1 grants end users a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to use and modify free Community content in commercial or non-commercial projects, including client work when incorporated into a broader end product.

The license prohibits reselling, redistributing, sublicensing, sharing, publishing, or making the free content available as a standalone asset; reposting it to another marketplace or repository; using it to create competing templates/components/design assets; and claiming the content as the end user's original work.

### Decision

- Zest is the only recommended implementation candidate from this research pass.
- It may be used only for a one-off adapted 15 A.D. end site after explicit user approval.
- Do not place the original Framer template in `/templates`, expose it as a reusable generator asset, or redistribute it through this repository.
- If the final site remains local static HTML/CSS, document that it is a licensed manual adaptation and retain the template creator, Marketplace URL, and license URL in the site README.
- TAB Kitchen & Bakery remains inspiration-only.
- Any component later considered from 21st.dev, Magic UI, Animate UI, Aceternity UI, React Bits, GSAP, or Codrops requires separate component-level license QA before code is copied.

## Implementation Conditions

- Do not download or copy a shortlisted template until the user chooses it.
- Preserve all applicable license notices and restrictions.
- Do not redistribute Tooplate source packages as templates.
- Do not remove attribution where a future selected asset requires it.
- Remove all unverified business content and stock claims before creating a demo.
- Every generated site must include “Unofficial demo website draft.”
