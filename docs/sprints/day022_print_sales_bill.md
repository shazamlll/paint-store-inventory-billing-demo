---
title: "Day 022 Print Sales Bill"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 022 Print Sales Bill

## Objective

Add a local browser-print sales bill output without expanding into full reporting.

## Completed

- Added local printable sales bill behavior:
  - `createPrintableSalesBill`
  - `getPrintablePaymentStamp`
- Added `/sales/print` route with:
  - shop header;
  - customer copy label;
  - order number and payment stamp;
  - item table;
  - subtotal, discount, payment, balance, and total;
  - browser print action;
  - print media cleanup.
- Updated homepage and sales page entries.
- Added test coverage:
  - `test/sales-print.test.js`
  - `test/scaffold.test.js`

## Local Print Contract

- Printable bills are generated from a saved local sales order shape.
- Payment stamps stay short for paper receipts: `PAID`, `PARTIAL`, `UNPAID`, or `UNKNOWN`.
- The printable page uses demo local data until persisted saved orders are intentionally wired.
- Browser printing is the only output path for this sprint.
- No Supabase reads/writes, PDF generation service, invoice numbering, or tax/accounting workflow is introduced.

## Deferred

- Persisted sales order selection.
- PDF file export.
- Store logo and receipt template settings.
- Chinese-localized receipt copy.
- Daily report export.

## Course Correction

Continue to Day 023 daily report export. The next sprint should summarize local daily sales in a print-friendly or markdown-friendly form without becoming analytics.
