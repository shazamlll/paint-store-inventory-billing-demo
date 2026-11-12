---
title: "Day 019 Manual Adjustment"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 019 Manual Adjustment

## Objective

Add a local manual stock adjustment workflow that requires a reason and records an inventory movement.

## Completed

- Added local manual adjustment behavior:
  - `createManualAdjustmentDraft`
  - `validateManualAdjustmentDraft`
  - `applyManualInventoryAdjustment`
- Added validation for:
  - missing product;
  - non-numeric or zero quantity changes;
  - stock going negative;
  - missing reason.
- Added `/inventory/adjustments` route with local state.
- Updated dashboard current status and route entry.
- Added test coverage:
  - `test/inventory-adjustments.test.js`
  - `test/scaffold.test.js`

## Local Adjustment Contract

- Manual adjustments use a product snapshot, quantity delta, and required reason.
- A valid adjustment updates local product stock without mutating the original product list.
- A valid adjustment creates an `adjustment` inventory movement with source table `manual_adjustments`.
- Negative adjustments cannot reduce stock below zero.
- No Supabase reads/writes, approvals, stocktake batches, or accounting effects are introduced.

## Deferred

- Supabase persistence for adjustments.
- Adjustment approval workflow.
- Full stocktake/session workflow.
- Adjustment print/export.
- Role permissions.

## Course Correction

Continue to Day 020 dashboard. The next sprint should summarize today sales, collection, receivables, and low stock from local data.
