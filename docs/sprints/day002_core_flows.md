---
title: "Day 002 Core Flows"
created: 2026-06-22
updated: 2026-06-22
project: paint-store-inventory-billing
stage: completed
---

# Day 002 Core Flows

## Objective

Map the three MVP flows before schema or UI work: sales billing, purchase receiving, and payment tracking.

## Flow 1: Sales Billing

- Primary actor: clerk or owner.
- Primary document: `sales_order`.
- Trigger: a buyer or contractor purchases paint, primer, thinner, supplies, or tools.
- Steps:
  - select or quick-create the customer;
  - add products, quantities, prices, discounts, and notes;
  - choose paid, partially paid, or unpaid;
  - save and print/share the sales bill;
  - review stock deduction and receivable impact.
- Data effects:
  - create `sales_order`;
  - create `sales_order_items`;
  - create stock-deduction `inventory_movements`;
  - create or update payment record;
  - increase customer receivable if unpaid or partially paid.
- Completion signal: one sales bill updates stock, payment state, and receivable state.

## Flow 2: Purchase Receiving

- Primary actor: owner or inventory clerk.
- Primary document: `purchase_order`.
- Trigger: supplier delivery arrives.
- Steps:
  - select or quick-create supplier;
  - add products, quantities, unit costs, and delivery notes;
  - record supplier payment state;
  - save purchase receiving document;
  - review stock increase and supplier payment state.
- Data effects:
  - create `purchase_order`;
  - create `purchase_order_items`;
  - create stock-receiving `inventory_movements`;
  - update product cost reference when useful;
  - record supplier payment status.
- Completion signal: received stock increases without manual product-stock editing.

## Flow 3: Payment Tracking

- Primary actor: owner or receivables keeper.
- Primary document: `payment`.
- Trigger: customer pays an old balance, pays partially, or combines payment with a new credit sale.
- Steps:
  - open customer receivable page;
  - review unpaid and partially paid sales bills;
  - record amount, method, date, and note;
  - link payment to one or more sales bills;
  - review updated customer balance.
- Data effects:
  - create `payment`;
  - link payment to sales orders;
  - reduce customer receivable balance;
  - update sales order payment status;
  - leave inventory unchanged.
- Completion signal: customer balance is explainable without manual recalculation.

## Course Correction

Continue to Day 003 data model. The table list should be derived from these three flows, with `inventory_movements` as the audit trail for stock changes and `payments` as the audit trail for money received or owed.
