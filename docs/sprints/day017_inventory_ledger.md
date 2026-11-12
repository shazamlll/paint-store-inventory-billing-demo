---
title: "Day 017 Inventory Ledger"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 017 Inventory Ledger

## Objective

Expose local inventory movement history by product across sales deductions and purchase receiving movements.

## Completed

- Added local inventory ledger behavior:
  - `getInventoryLedgerRows`
  - `getInventoryLedgerSummary`
  - `getProductMovementHistory`
- Added inventory ledger UI:
  - `/inventory`
  - product-level movement totals;
  - stock in, stock out, net change, last stock;
  - selected product movement history.
- Updated dashboard current status:
  - `app/page.js`
- Added test coverage:
  - `test/inventory-ledger.test.js`
  - `test/scaffold.test.js`

## Local Ledger Contract

- Combine local movement rows from sales and purchase receiving.
- Group rows by product name and spec snapshots.
- Track total stock in, total stock out, net change, latest source order, and last stock-after.
- Preserve source movement order for selected product history.
- No Supabase reads/writes, search, filtering, export, or persistence contract is introduced.

## Deferred

- Real cross-page movement persistence.
- Product filtering and search.
- Dedicated movement detail route.
- Export/print ledger.
- Supabase-backed ledger query.

## Course Correction

Continue to Day 018 low-stock alert. The next sprint should surface local products where current stock is at or below the low-stock threshold.
