---
title: "Day 009 Sales Form UI"
created: 2026-06-22
updated: 2026-06-22
project: paint-store-inventory-billing
stage: completed
---

# Day 009 Sales Form UI

## Objective

Build a static/local-first sales bill form that combines the product and customer catalogs before persistence is introduced.

## Completed

- Added sales form calculation helpers:
  - `src/sales-form.js`
- Added local sales bill route:
  - `app/sales/page.js`
  - `app/sales/SalesFormClient.js`
- Added dashboard entry to sales:
  - `app/page.js`
- Added sales form tests:
  - `test/sales-form.test.js`

## UI Scope

- Select customer.
- Add product lines.
- Edit quantities and line discounts.
- Calculate subtotal, discount, total, payment status, payment amount, and receivable delta.
- Keep all state local to the browser.

## Deferred

- Persisting sales orders and line items.
- Stock deduction.
- Payment record creation.
- Printable sales detail.

## Course Correction

Continue to Day 010 save sales order. That sprint should be the first point where real persistence semantics are designed, but it can still start with local tests before Supabase wiring.
