---
title: "Day 026 End-to-End Demo"
created: 2026-06-24
updated: 2026-06-24
project: paint-store-inventory-billing
stage: completed
---

# Day 026 End-to-End Demo

## Objective

Prove the local MVP can demonstrate one complete operating path: purchase receiving, sales billing, payment state, and stock verification.

## Completed

- Added `src/end-to-end-demo.js` to compose existing local purchase, sales, inventory, and payment helpers.
- Added a deterministic Day 026 scenario:
  - receive one supplier purchase;
  - create one customer sales bill;
  - derive a payment draft from the saved sale;
  - verify starting stock, received quantity, sold quantity, and final stock.
- Added `/demo` as an owner-readable walkthrough page.
- Updated the homepage marker to Day 026 and added the end-to-end demo entry.
- Added Day 026 test coverage in `test/end-to-end-demo.test.js`.

## Local Contract

- The end-to-end demo is local JavaScript orchestration only.
- Purchase receiving and sales billing use the existing local save contracts.
- Inventory changes are calculated through existing inventory movement helpers.
- Payment remains a local draft derived from the saved sales order.
- Supabase persistence, production authentication, roles, RLS, and multi-store behavior remain deferred.

## Deferred

- Supabase-backed transaction execution.
- Actual payment posting beyond the existing local draft.
- Deployment and installation flow.
- Import/export tooling.
- Production security hardening.

## Verification

- RED: `node --test test/end-to-end-demo.test.js`
- GREEN: `node --test test/end-to-end-demo.test.js test/scaffold.test.js`
- Full suite: `npm test`
- Production build: `npm run build`
- `/demo` route check

## Correction

Continue to Day 027 UX copy polish. The next sprint should improve Chinese labels and owner-friendly wording without changing workflow behavior.
