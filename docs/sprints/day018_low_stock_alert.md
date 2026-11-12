---
title: "Day 018 Low-stock Alert"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 018 Low-stock Alert

## Objective

Surface local products where current stock is at or below the low-stock threshold.

## Completed

- Added local low-stock alert behavior:
  - `getLowStockAlertRows`
  - `getLowStockAlertSummary`
- Added local seed data with both alert states:
  - below threshold;
  - at threshold.
- Added `/inventory/low-stock` route for owner scanning.
- Updated dashboard current status and route entry.
- Added test coverage:
  - `test/low-stock-alerts.test.js`
  - `test/product-list.test.js`
  - `test/scaffold.test.js`

## Local Alert Contract

- Use `currentStock <= lowStockThreshold` as the alert rule.
- Show below-threshold and at-threshold items separately in summary counts.
- Sort alert rows by largest stock gap first, then current stock, product name, and spec.
- Keep the screen local-only with no Supabase reads/writes or replenishment workflow.

## Deferred

- Manual stock adjustment.
- Purchase suggestions or reorder workflow.
- Alert acknowledgement.
- Low-stock notifications.
- Supabase-backed alert query.

## Course Correction

Continue to Day 019 manual adjustment. The next sprint should add a local stock adjustment with a required reason.
