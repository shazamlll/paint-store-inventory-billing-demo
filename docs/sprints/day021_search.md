---
title: "Day 021 Search"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 021 Search

## Objective

Add a local unified search surface for products, customers, and sales orders.

## Completed

- Added local search behavior:
  - `searchLocalRecords`
  - `getSearchSummary`
- Added `/search` route with:
  - local demo query;
  - result counts;
  - product/customer/order result rows.
- Updated homepage current status and search entry.
- Added test coverage:
  - `test/search.test.js`
  - `test/scaffold.test.js`

## Local Search Contract

- Blank queries return no results.
- Matching is case-insensitive.
- Products match name, spec, and unit.
- Customers match name, phone, and notes.
- Sales orders match order number, customer snapshot, date, status, notes, and item snapshots.
- Result groups stay predictable: products, customers, then orders.
- Matching orders are sorted newest first.
- Demo data remains local until persistence is intentionally wired.

## Deferred

- Supabase-backed search queries.
- Search filters, pagination, and ranking.
- Persisted search history.
- Keyboard shortcut or global command palette.
- Cross-screen search overlay.

## Course Correction

Continue to Day 022 print sales bill. The next sprint should add a print or PDF-style sales bill output without expanding into full reporting.
