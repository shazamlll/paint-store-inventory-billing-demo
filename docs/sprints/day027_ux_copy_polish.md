---
title: "Day 027 UX Copy Polish"
created: 2026-06-24
updated: 2026-06-24
project: paint-store-inventory-billing
stage: completed
---

# Day 027 UX Copy Polish

## Objective

Make the local demo entry points easier for a Chinese paint-store owner to scan during a walkthrough.

## Completed

- Added `src/ux-copy.js` as a small owner-facing copy module.
- Updated the homepage to Day 027 with Chinese headline, introduction, navigation labels, demo-data labels, and section labels.
- Updated `/demo` with Chinese headings, step labels, document table labels, payment note, and stock verification labels.
- Added Chinese status formatting for payment and verification states.
- Added Day 027 copy tests in `test/ux-copy.test.js`.

## Local Contract

- This is a targeted UX copy polish, not a full localization system.
- Product names and existing demo fixture data may remain in English.
- No runtime language switching, translation framework, persistence, auth, RLS, or workflow logic changes are included.
- The homepage and `/demo` page should remain the primary owner-readable walkthrough surfaces.

## Deferred

- Complete app-wide Chinese localization.
- Runtime language switching.
- Deployment or installation copy.
- Production security hardening.
- Data persistence and Supabase wiring.

## Verification

- RED: `node --test test/ux-copy.test.js`
- GREEN: `node --test test/ux-copy.test.js test/scaffold.test.js test/end-to-end-demo.test.js`
- Full suite: `npm test`
- Production build: `npm run build`
- Route checks: `/` and `/demo`

## Correction

Continue to Day 028 one-page pitch. The next sprint should package the product offer for paint-store owners without changing app behavior.
