---
title: "Day 003 Data Model"
created: 2026-06-22
updated: 2026-06-22
project: paint-store-inventory-billing
stage: completed
---

# Day 003 Data Model

## Objective

Derive the MVP table list and key fields from the Day 002 core flows.

## Table List

| Table | Purpose |
| --- | --- |
| `products` | Paint, primer, thinner, color materials, supplies, and tools |
| `customers` | Customer profile and receivable balance |
| `suppliers` | Supplier profile and lightweight payable balance |
| `sales_orders` | Sales bill header |
| `sales_order_items` | Sales bill line items |
| `purchase_orders` | Supplier receiving header |
| `purchase_order_items` | Supplier receiving line items |
| `payments` | Customer payment records |
| `inventory_movements` | Stock-change audit trail |

## Flow Coverage

### Sales Billing

Tables:

- `sales_orders`
- `sales_order_items`
- `inventory_movements`
- `payments`
- `customers`

Business rule: one sales bill should update stock, payment state, and customer receivables from the same document.

### Purchase Receiving

Tables:

- `purchase_orders`
- `purchase_order_items`
- `inventory_movements`
- `products`
- `suppliers`

Business rule: receiving stock should create inventory movements rather than manually editing product stock without an audit trail.

### Payment Tracking

Tables:

- `payments`
- `sales_orders`
- `customers`

Business rule: payment can reduce customer receivables without changing stock.

## Key Design Decisions

- Keep the MVP at exactly nine tables.
- Use document headers and line items for sales and purchases.
- Use snapshot fields on line items so old bills still display correctly after product names or specs change.
- Keep `current_stock` and balance fields for fast display, but use `inventory_movements` and documents as the audit trail.
- Do not add tax, invoice authority, multi-store, user roles, or advanced accounting tables in V1.

## Course Correction

Continue to Day 004 project setup. The first app scaffold should support these tables but does not need to create the Supabase schema yet; Day 005 owns actual database schema setup.
