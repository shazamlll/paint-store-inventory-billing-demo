---
title: "Day 035 Development Supabase Reads"
created: 2026-06-27
updated: 2026-06-27
project: paint-store-inventory-billing
stage: completed
---

# Day 035 Development Supabase Reads

## Objective

Prepare the app for development Supabase reads without enabling real business writes.

## Completed

- Added `src/development-read-connection.js`.
- Added `test/development-read-connection.test.js`.
- Added environment validation for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Added a browser-safe Supabase client factory using only public development config.
- Added a read allowlist for:
  - `products`
  - `customers`
  - `suppliers`
- Kept writes blocked in the read plan.

## Boundary

Day 035 is 只读. It does not connect sales, purchases, payments, or inventory writes to Supabase.

明确边界：本 sprint 不接真实业务写入。Existing local pages can continue using local sample data until the development migration and RLS verified checks are complete.

## Required Before UI Reads

- Day 034 SQL has been applied to the development Supabase project.
- RLS verified for the current development user.
- Store membership exists for the current user.
- Catalog rows have valid `store_id`.

## RLS verified Gate

Only enable UI reads after RLS verified checks confirm that the user can read their own store data and cannot read another store's rows.

## Correction

Continue to Day 036 by adding a small development-only read view or by wiring product/customer/supplier pages to Supabase reads behind a verified development gate. Live writes remain blocked.
