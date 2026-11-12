---
title: "Day 025 Demo Seed Data"
created: 2026-06-24
updated: 2026-06-24
project: paint-store-inventory-billing
stage: completed
---

# Day 025 Demo Seed Data

## Objective

Expand local demo data so the MVP reads like an operating paint store during walkthroughs without adding persistence or production authentication.

## Completed

- Added `src/demo-data.js` with richer local fixtures:
  - 30+ products across paint, primer, stains, sundries, prep supplies, and tools;
  - 8+ customers across walk-in, homeowner, contractor, property manager, and workshop profiles;
  - 4+ suppliers;
  - sales orders across paid, partial, and unpaid states;
  - purchase receiving documents across paid, partial, and unpaid states;
  - inventory movements for sales, purchases, and manual adjustments.
- Kept existing catalog exports compatible:
  - `seedProducts`
  - `seedCustomers`
  - `seedSuppliers`
- Added home page demo-data counts for operational scanning.
- Added Day 025 test coverage in `test/demo-data.test.js`.

## Local Demo Data Contract

- Demo data is local JavaScript fixture data only.
- Existing workflow pages may use the richer seed catalogs without Supabase reads or writes.
- Demo sales, purchases, and inventory movements must reference valid local products, customers, and suppliers.
- The dataset intentionally includes low-stock items and receivable orders so existing dashboard, report, search, ledger, and alert surfaces have meaningful examples.

## Deferred

- Supabase-backed seed loading.
- CSV import/export.
- Admin reset controls.
- Production auth, roles, and RLS.
- Analytics beyond the existing dashboard and daily report.

## Course Correction

Continue to Day 026 only after choosing the next smallest workflow gap. Good candidates are local session persistence, payment posting, or a minimal deployment/build cleanup sprint.
