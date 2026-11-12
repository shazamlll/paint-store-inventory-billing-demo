---
title: "Day 008 Customer List"
created: 2026-06-22
updated: 2026-06-22
project: paint-store-inventory-billing
stage: completed
---

# Day 008 Customer List

## Objective

Add a local-first customer list and add-customer workflow so sales-bill work has a customer catalog foundation.

## Completed

- Added customer data and helpers:
  - `src/customers.js`
- Added local customer list route:
  - `app/customers/page.js`
  - `app/customers/CustomerListClient.js`
- Added dashboard entry to customers:
  - `app/page.js`
- Added customer list tests:
  - `test/customer-list.test.js`

## UI Scope

- Customer count.
- Receivable customer count.
- Receivable balance total.
- Walk-in customer signal for quick sales.
- Add-customer form with local validation.
- Customer table with receivable status.

## Deferred

- Editing existing customers.
- Persisting customers to Supabase.
- Customer search and filters.
- Customer receivable detail drill-down.

## Course Correction

Continue to Day 009 sales form UI. Keep it static/local-first and use the product/customer catalogs created in Day 006-Day 008.
