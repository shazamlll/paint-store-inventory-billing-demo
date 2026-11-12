---
title: "Day 013 Payment Status"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 013 Payment Status

## Objective

Make paid, partial, and unpaid sales orders easy to scan locally and define the first local payment draft contract.

## Completed

- Added local payment status behavior:
  - `getPaymentStatusSummary`
  - `createPaymentDraftFromSalesOrder`
  - `getPaymentStatusTone`
- Extended sales form UI:
  - payment status summary shows total receivable due;
  - paid, partial payment, and unpaid buckets show order count, collected amount, and receivable due;
  - summary remains derived from local saved orders.
- Updated dashboard current status:
  - `app/page.js`
- Added test coverage:
  - `test/payment-status.test.js`
  - `test/scaffold.test.js`

## Local Payment Contract

- Summary accepts the existing Day 010 saved-order shape.
- Status buckets stay limited to `paid`, `partial`, and `unpaid`.
- Totals cover order count, total amount, collected amount, and receivable amount.
- Payment draft records include source table, source order number, customer snapshot, payment date, amount, payment status, receivable after payment, and notes.
- No Supabase reads or writes are introduced.

## Deferred

- Persisted payment rows.
- Partial payment top-up workflow.
- Customer receivable balance updates.
- Receivables list route.
- Payment method tracking.

## Course Correction

Continue to Day 014 receivables list. The next sprint should group unpaid and partially paid sales orders by customer so the owner can see who owes money.
