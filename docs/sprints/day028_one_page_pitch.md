---
title: "Day 028 One-Page Pitch"
created: 2026-06-24
updated: 2026-06-24
project: paint-store-inventory-billing
stage: completed
---

# Day 028 One-Page Pitch

## Objective

Package the local paint-store demo into a one-page pitch that can be shown to a store owner before or during a short walkthrough.

## Completed

- Added `pitchCopy` to `src/ux-copy.js` with the audience, promise, owner pains, demo path, receipt proof, boundaries, and next step.
- Added `/pitch` to the homepage navigation as `一页介绍`.
- Added `app/pitch/page.js` as a compact local pitch page for paint-store owner conversations.
- Added `test/pitch.test.js` to cover the copy contract, navigation entry, route source, and sprint documentation.

## Local Contract

- This is a local one-page pitch inside the existing app, not a public marketing landing page.
- The page explains the current local demo and does not create lead capture, pricing, analytics, deployment, auth, Supabase persistence, RLS, or multi-store behavior.
- The pitch should keep the same owner-facing vocabulary as the Day 027 UX copy polish.

## Deferred

- Public website copy and SEO.
- Customer onboarding or contact forms.
- Production deployment and installation guidance.
- Security hardening, which remains in the post-Day030 backlog.
- Day 029 demo script for a guided owner walkthrough.

## Verification

- RED: `node --test test/pitch.test.js`
- GREEN: `node --test test/pitch.test.js`
- Full suite: `npm test`
- Production build: `npm run build`
- Route checks: `/pitch` and `/`

## Correction

Continue to Day 029 demo script. The next sprint should turn this one-page pitch into a concrete walkthrough script without changing production persistence or auth boundaries.
