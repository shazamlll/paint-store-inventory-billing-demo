---
title: "Day 042 Purchase Receiving Write Transaction"
created: 2026-06-30
updated: 2026-06-30
project: paint-store-inventory-billing
stage: completed
---

# Day 042 Purchase Receiving Write Transaction

## Goal

Persist purchase receiving, supplier payable state, stock increase, and inventory movements through a server-side transaction path.

## Completed

- Added `src/purchase-persistence.js` for purchase transaction preparation, validation, role gating, and RPC submission.
- Added `app/api/purchases/orders/route.js` so browser code calls a local server route instead of writing Supabase tables directly.
- Added `supabase/migrations/0004_purchase_order_transaction.sql` with `public.save_purchase_order_transaction(p_payload jsonb)`.
- Extended development page reads to include suppliers so persisted supplier IDs can flow into purchase receiving.
- The SQL function validates active store membership, supplier store ownership, product store ownership, payment state, unit cost, and line quantities.
- Product rows are locked `for update` before stock increase, then purchase order items and inventory movements are written in the same database function.
- Supplier `payable_balance` is increased by the receiving payable delta.
- Purchase page now loads development Supabase product and supplier catalog reads when available.
- Browser purchase UI calls `/api/purchases/orders` only when products and suppliers both come from Supabase; local fallback remains an explicit demo state.

## Boundary

- This is a development purchase persistence path, not a full production launch.
- The browser still keeps local saved-order display state for the current screen.
- The durable database write path is server-side, scoped by authenticated store context, and does not trust client-supplied `store_id`.
- Missing persisted supplier or product IDs, invalid unit cost or quantity, overpayment, missing store context, and unsupported roles are blocked before or inside the transaction.
- Payments, audit logs, backups, deployment, and standalone payment workflows remain outside this sprint.

## Verification

- `node --test test/purchase-persistence.test.js`
- `npm test`
- `npm run build`

## Next

Day 043 should persist customer payments, receivable summaries, audit log rows, and correction or reversal rules for sales and payment-sensitive workflows.
