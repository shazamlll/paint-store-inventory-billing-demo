---
title: "Day 043 Audit Logs, Correction Rules, and Receivable Foundation"
created: 2026-06-30
project: paint-store-inventory-billing
stage: completed
---

# Day 043 Audit Logs, Correction Rules, and Receivable Foundation

## Goal

Make the first production write paths defensible before adding the full standalone payment workflow.

## Completed Scope

- Added `supabase/migrations/0005_audit_correction_foundation.sql`.
- Added `public.audit_logs` with store-scoped RLS and select access for authenticated store members.
- Added audit triggers for sales orders, purchase orders, payments, and inventory movements.
- Destructive deletes are removed from key transactional tables by dropping delete policies for sales orders, sales items, purchase orders, purchase items, payments, and inventory movements.
- Added correction columns to sales and purchase orders.
- Added `reverse_sales_order_transaction` for unpaid sales orders.
- Added `src/correction-policy.js` so product behavior and SQL rules share the same correction vocabulary.

## Payment Boundary

Standalone customer payment entry is deferred. The existing sales-order transaction can still record an attached payment amount, but independent customer collection, payment allocation, and payment reversal should be implemented as a later payment-specific sprint.

Payment reversal remains a future sprint dependency. For Day 043, a sales order with an attached payment is blocked from automatic reversal and must wait for the standalone payment reversal workflow.

## Correction Rules

- Sales orders are never hard-deleted in the production path.
- Unpaid sales orders can be reversed through `reverse_sales_order_transaction`.
- Paid or partially paid sales orders require the future payment reversal workflow before automatic order reversal.
- Purchase order reversal is documented as a future transaction with the same no-delete policy.
- Inventory movement corrections should be additive adjustment rows, not edits or deletes of historical movement rows.

## Receivable Foundation

Sales receivables remain queryable from persisted sales orders and customer balances. Day 043 does not add a new receivable UI; it protects the persisted balances and documents how reversal affects them.

## Verification

- `test/audit-reversal.test.js` covers the adjusted sprint scope, correction policy, SQL migration boundary, and this sprint document.
- Full verification should run `npm test` and `npm run build` before release or push.

## Remaining Work

- Build standalone customer payment creation and allocation.
- Add payment reversal and refund/void handling.
- Add purchase order reversal transaction.
- Add operational audit-log views for owner/admin users.
