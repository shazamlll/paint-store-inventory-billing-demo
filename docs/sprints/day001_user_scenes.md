---
title: "Day 001 User Scenes"
created: 2026-06-22
updated: 2026-06-22
project: paint-store-inventory-billing
stage: completed
---

# Day 001 User Scenes

## Objective

Define three realistic first-version scenes for a lightweight paint-store billing, inventory, payment, and receivables system.

## Scenes

### 1. Owner Checks The Shop Before Closing

- Role: owner
- Pain: the owner does not know which paint items are running low, which customer still owes money, or whether today's sales bill records match cash collected.
- Trigger: closing time.
- Workflow:
  - open today's dashboard;
  - review total sales, payment collected, new receivable balance, and low stock items;
  - inspect suspicious product or customer rows through their related bills and stock movements.
- Acceptance signal: the owner can explain today's sales, collection, receivables, and low-stock risk in under two minutes.

### 2. Clerk Creates A Fast Customer Sales Bill

- Role: clerk
- Pain: manual bill writing misses product specs, price changes, payment status, or stock deduction.
- Trigger: a walk-in customer buys paint, primer, thinner, and tools while others wait.
- Workflow:
  - search or quick-create customer;
  - add products, quantity, unit price, discount, and payment method;
  - save and print the bill while stock is deducted automatically.
- Acceptance signal: a normal bill can be finished in less than 30 seconds and stock changes without separate inventory entry.

### 3. Receivables Follow-Up For A Regular Contractor

- Role: receivables
- Pain: contractors pay partially or later, so the shop loses track of unpaid sales bills and customer balances.
- Trigger: a contractor pays part of last week's balance and places a new credit order.
- Workflow:
  - open the customer's receivable page;
  - record payment against the correct balance;
  - create the new credit sales bill and confirm the updated receivable total.
- Acceptance signal: the shop can show payment, open bills, and remaining receivable balance without recalculating manually.

## Course Correction

Continue with Day 002 core flows. The scenes confirm the first workflow should be billing-driven: create or update a sales bill first, then let inventory and receivables follow.
