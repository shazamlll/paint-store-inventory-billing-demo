---
title: "Day 041 Sales Order Write Transaction"
created: 2026-06-30
updated: 2026-06-30
project: paint-store-inventory-billing
stage: completed
---

# Day 041 Sales Order Write Transaction

## Goal

Persist sales orders, line items, payment state, receivables, stock deduction, and inventory movements through a server-side transaction path.

## Completed

- Added `src/sales-persistence.js` for sales transaction preparation, validation, role gating, and RPC submission.
- Added `app/api/sales/orders/route.js` so browser code calls a local server route instead of writing Supabase tables directly.
- Added `supabase/migrations/0003_sales_order_transaction.sql` with `public.save_sales_order_transaction(p_payload jsonb)`.
- The SQL function validates active store membership, customer store ownership, product store ownership, payment state, and line quantities.
- Product rows are locked `for update` before stock deduction, then sales order items and inventory movements are written in the same database function.
- Customer `receivable_balance` is increased by the order receivable delta, and a payment row is created when the payment amount is positive.
- Sales page now loads development Supabase catalog reads when available so persisted customer and product IDs can flow into the write path.
- Browser sales UI calls `/api/sales/orders` only when products and customers both come from Supabase; local fallback remains an explicit demo state.

## Boundary

- This is a development sales persistence path, not a full production launch.
- The browser still keeps local saved-order display state for the current screen and printable detail.
- The durable database write path is server-side, scoped by authenticated store context, and does not trust client-supplied `store_id`.
- `insufficient stock`, missing persisted IDs, overpayment, missing store context, and unsupported roles are blocked before or inside the transaction.
- Payments, audit logs, backups, deployment, and purchase writes remain outside this sprint.

## Verification

- `node --test test/sales-persistence.test.js`
- `npm test`
- `npm run build`

## Next

Day 042 should persist purchase receiving, supplier payable state, stock increase, and purchase inventory movements through the same server-side transaction pattern.
