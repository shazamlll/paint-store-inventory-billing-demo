---
title: "Day 010 Save Sales Order"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 010 Save Sales Order

## Objective

Define and implement local save-sales-order behavior before wiring Supabase persistence.

## Completed

- Added local sales order save semantics:
  - `saveSalesOrder`
  - `validateSalesDraft`
  - `createSalesOrderNumber`
- Extended sales form UI:
  - `app/sales/SalesFormClient.js`
- Updated dashboard current status:
  - `app/page.js`
- Extended sales form tests:
  - `test/sales-form.test.js`

## Local Save Contract

- Generates order numbers like `SO-20260623-001`.
- Saves an order header snapshot with customer name, date, totals, payment status, payment amount, receivable delta, and notes.
- Saves line item snapshots with product name, spec, unit, quantity, unit price, discount, and line total.
- Appends saved orders immutably to browser-local state.
- Validates customer, line presence, positive quantities, and non-negative payment amount.

## Deferred

- Supabase insert transaction.
- Stock deduction.
- Payment row creation.
- Sales detail page.

## Course Correction

Continue to Day 011 stock deduction. Keep it local/test-first first: sales order should produce inventory movements and resulting stock values before persistence is wired.
