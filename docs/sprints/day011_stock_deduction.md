---
title: "Day 011 Stock Deduction"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 011 Stock Deduction

## Objective

Make a saved local sales order deduct product stock and produce local inventory movements before wiring Supabase persistence.

## Completed

- Added local inventory movement behavior:
  - `findProductForSalesItem`
  - `validateSalesOrderInventory`
  - `applySalesOrderToInventory`
  - `getInventoryMovementSummary`
- Extended sales form UI:
  - product selector now shows current stock;
  - saving an order validates available stock;
  - successful save deducts local stock;
  - recent local inventory movements are visible under the sales order panel.
- Updated dashboard current status:
  - `app/page.js`
- Added test coverage:
  - `test/inventory-movements.test.js`
  - `test/scaffold.test.js`

## Local Inventory Contract

- Match saved sales line snapshots back to products by product name and spec.
- Aggregate repeated product lines before stock validation and deduction.
- Reject missing products before saving inventory effects.
- Reject insufficient stock before deducting local stock.
- Deduct quantity from `currentStock` immutably.
- Create one local `sale` inventory movement per affected product.
- Movement records include product snapshot, quantity delta, stock after deduction, source table, source order number, and notes.

## Deferred

- Supabase transaction for sales order, line items, inventory movements, and product stock update.
- Payment row creation.
- Receivable balance persistence.
- Inventory ledger route.
- Printable sales detail page.

## Course Correction

Continue to Day 012 sales detail. The next sprint should render one saved local order in a review/print-friendly detail panel before adding persistence.
