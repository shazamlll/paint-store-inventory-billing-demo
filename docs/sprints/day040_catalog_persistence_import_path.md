---
title: "Day 040 Catalog Persistence and Import Path"
created: 2026-06-29
updated: 2026-06-29
project: paint-store-inventory-billing
stage: completed
---

# Day 040 Catalog Persistence and Import Path

## Goal

Move products, customers, and suppliers from local-only catalog handling toward verified development Supabase persistence while keeping business workflow writes blocked.

## Completed

- Added `src/catalog-persistence.js` for catalog write preparation and persistence helpers.
- Added server-side catalog API routes:
  - `app/api/catalog/products/route.js`
  - `app/api/catalog/customers/route.js`
  - `app/api/catalog/suppliers/route.js`
- Added a server Supabase client path that accepts the current browser session bearer token without exposing service-role credentials.
- Updated product and customer UI flows to submit catalog rows through API routes instead of calling Supabase table writes in the browser.
- Extended product editor data loading so it can start from development Supabase read rows when available.
- Added a development catalog import plan that scopes approved CSV batches to the active store.
- Fixed the protected-route auth shell initial state so protected pages start from a stable loading gate before hydration.

## Boundary

- Catalog writes are scoped to the authenticated user's active store.
- The write preparation layer ignores client-supplied `store_id`; it uses server-controlled `store_id` from store context.
- Browser components may call local API routes, but they do not call `.from().insert()` or `.from().update()` directly.
- The import plan is for development catalog data only.
- Production writes remain blocked.
- Sales, purchase, inventory, payment, audit, and backup work remain blocked until Day 041-046.

## Verification

- `node --test test/auth.test.js test/catalog-persistence.test.js test/product-editor.test.js test/customer-list.test.js`
- `npm test`
- `npm run build`

## Next

Day 041 should persist sales orders, line items, payment state, receivables, stock deduction, and inventory movements as one server-side transaction. Do not claim production workflow readiness until transaction behavior, audit logs, backups, and deployment gates are complete.
