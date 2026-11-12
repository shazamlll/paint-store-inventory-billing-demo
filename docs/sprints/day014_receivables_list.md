---
title: "Day 014 Receivables List"
created: 2026-06-23
updated: 2026-06-23
project: paint-store-inventory-billing
stage: completed
---

# Day 014 Receivables List

## Objective

Group unpaid and partially paid local sales orders by customer so the owner can see who owes money and how much.

## Completed

- Added local receivables behavior:
  - `getReceivableRows`
  - `getCustomerReceivableSummary`
- Extended sales form UI:
  - customer receivables summary shows customer count and amount due;
  - customer rows show order count and amount due;
  - rows are derived from local saved orders only.
- Updated dashboard current status:
  - `app/page.js`
- Added test coverage:
  - `test/receivables.test.js`
  - `test/scaffold.test.js`

## Local Receivables Contract

- Ignore fully paid orders.
- Include partial and unpaid orders where `receivableDelta` is greater than zero.
- Group receivables by customer name snapshot.
- Preserve related order numbers and payment statuses for follow-up.
- Sort customers by receivable amount descending.
- No customer balance writes or Supabase reads/writes are introduced.

## Deferred

- Dedicated receivables route.
- Customer balance persistence.
- Payment collection action.
- Aging buckets or due dates.
- Receivables export.

## Course Correction

Continue to Day 015 purchase receiving UI. The next sprint should start the purchase side with a local receiving form before implementing stock receiving movements.
