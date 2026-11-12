---
title: "Day 033 First-Store Import Path"
created: 2026-06-27
updated: 2026-06-27
project: paint-store-inventory-billing
stage: completed
---

# Day 033 First-Store Import Path

## Objective

Turn the Day 031 intake templates and Day 032 multi-tenant schema into a first-store import dry run. This prepares the database connection path without writing real production data.

## Completed

- Added `src/first-store-import.js`.
- Reused the Day 031 CSV template headers as the import contract.
- Added a source map for products, customers, suppliers, opening stock, and opening receivables.
- Added CSV header validation and row counting.
- Added an ordered dry-run plan:
  - prepare store;
  - prepare owner membership;
  - validate and prepare catalog, customer, supplier, stock, and receivable imports.
- Added `test/first-store-import.test.js`.

## Boundary

Day 033 不写入真实 Supabase. It only validates files and builds an ordered dry-run plan.

Production writes stay blocked until:

- the real Day 031 intake fields are reviewed;
- the Day 032 RLS migration is applied and verified in a development Supabase project;
- import dry-run output is reviewed;
- backups and audit-log expectations are clear.

## Print Constraint Recorded

The real store has existing preprinted sales forms. Paper size is 32 开.

已记录：销售清单需要适配 32 开预印单据。

This is not implemented in Day 033. It becomes a later print-template requirement:

- support preprinted form positioning;
- support duplicate-copy output;
- test with the real 32 开 paper before live use.

## Correction

Continue to Day 034 by applying the migration and import dry run to a development Supabase project, or by adjusting schema/import fields if the real intake data does not match the current templates.
