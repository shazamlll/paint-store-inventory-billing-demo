---
title: "Day 012 Sales Detail"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 012 Sales Detail

## Objective

Render a saved local sales order as a review-ready and print-friendly bill detail before wiring persistence.

## Completed

- Added local sales detail behavior:
  - `createPrintableSalesOrderDetail`
  - `getSalesOrderDetailStatusLabel`
- Extended sales form UI:
  - saved orders are selectable;
  - the latest saved order is selected automatically;
  - a sales detail panel shows header, customer, date, payment status, line items, totals, receivable amount, and notes;
  - a `Print bill` action calls browser print.
- Updated dashboard current status:
  - `app/page.js`
- Added test coverage:
  - `test/sales-detail.test.js`
  - `test/scaffold.test.js`

## Local Detail Contract

- Accepts the Day 010 saved order shape without adding persistence fields.
- Converts payment status into owner-readable labels.
- Preserves line item snapshots for product, spec, unit, quantity, unit price, discount, and line total.
- Computes detail-level item count and total quantity.
- Keeps the detail panel local-only and avoids Supabase reads or writes.

## Deferred

- Dedicated persisted sales-order route.
- Print stylesheet or PDF export.
- Payment row creation.
- Receivable balance persistence.
- Receipt numbering beyond the current sales order number.

## Course Correction

Continue to Day 013 payment status. The next sprint should make paid, partial, and unpaid states easier to scan and prepare the payment data contract before Supabase writes are introduced.
