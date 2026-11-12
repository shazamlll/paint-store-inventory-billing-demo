---
title: "Day 032 Supabase Multi-Tenant RLS"
created: 2026-06-27
updated: 2026-06-27
project: paint-store-inventory-billing
stage: completed
---

# Day 032 Supabase Multi-Tenant RLS

## Objective

Prepare the database foundation for a real pilot without connecting the application UI to production data yet.

## Completed

- Added `supabase/migrations/0002_multi_tenant_rls.sql`.
- Added `stores` and `store_members`.
- Added `store_id` to the nine existing business tables.
- Changed sales and purchase order number uniqueness from global to per-store.
- Added `current_user_store_ids()` helper for RLS policies.
- Enabled RLS for stores, store members, and business tables.
- Added store-scoped select, insert, update, and delete policies for business tables.
- Added Day 032 tests in `test/supabase-multitenant-rls.test.js`.

## Boundary

Day 032 is still a database foundation sprint. It does not connect pages to Supabase reads or writes, and it does not accept real production data.

明确边界：本 sprint 不接真实业务写入，只准备门店隔离、`store_id` 和 RLS 基础。

This work stays behind the Day 031 intake gate:

- confirm the real import shape first;
- decide whether the first store uses manual entry or CSV import;
- do not wire real business writes until fields are confirmed;
- complete auth, RLS, backups, and audit logs before multi-user live use.

## Why Store Isolation Comes First

Every real product, customer, supplier, sales order, purchase order, payment, and inventory movement must belong to exactly one store. RLS must use that `store_id` before the app starts writing production data.

## Verification

- RED: `node --test test\supabase-multitenant-rls.test.js`
- GREEN: `node --test test\supabase-multitenant-rls.test.js`
- Full suite: `npm test`
- Production build: `npm run build`

## Correction

Continue to Day 033 only after reviewing the Day 031 intake data. Day 033 should either build a first-store import script or adjust the schema if the real store fields do not fit this migration.
