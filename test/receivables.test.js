import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getCustomerReceivableSummary,
  getReceivableRows
} from "../src/receivables.js";
import {
  createSalesLine,
  saveSalesOrder
} from "../src/sales-form.js";
import { seedCustomers } from "./fixtures/catalog.js";
import { seedProducts } from "./fixtures/catalog.js";

const root = fileURLToPath(new URL("..", import.meta.url));

function savedOrder(customer, paymentAmount, orderNumber) {
  return saveSalesOrder(
    [],
    {
      customer,
      lines: [
        createSalesLine(seedProducts[0], { quantity: 2, discountAmount: 3 }),
        createSalesLine(seedProducts[12], { quantity: 4 })
      ],
      paymentAmount,
      notes: ""
    },
    {
      orderDate: "2026-06-23",
      orderNumber
    }
  ).savedOrder;
}

test("Day 014 groups partial and unpaid saved orders by customer receivable balance", () => {
  const rows = getReceivableRows([
    savedOrder(seedCustomers[0], 85, "SO-20260623-001"),
    savedOrder(seedCustomers[1], 40, "SO-20260623-002"),
    savedOrder(seedCustomers[1], 0, "SO-20260623-003"),
    savedOrder(seedCustomers[2], 0, "SO-20260623-004")
  ]);

  assert.deepEqual(rows, [
    {
      customerName: "社区业主",
      orderCount: 2,
      receivableAmount: 130,
      latestOrderDate: "2026-06-23",
      orderNumbers: ["SO-20260623-002", "SO-20260623-003"],
      paymentStatuses: ["partial", "unpaid"]
    },
    {
      customerName: "北区物业经理",
      orderCount: 1,
      receivableAmount: 85,
      latestOrderDate: "2026-06-23",
      orderNumbers: ["SO-20260623-004"],
      paymentStatuses: ["unpaid"]
    }
  ]);
});

test("Day 014 computes receivable summary for owner scanning", () => {
  const summary = getCustomerReceivableSummary([
    savedOrder(seedCustomers[0], 85, "SO-20260623-001"),
    savedOrder(seedCustomers[1], 40, "SO-20260623-002"),
    savedOrder(seedCustomers[1], 0, "SO-20260623-003")
  ]);

  assert.deepEqual(summary, {
    customerCount: 1,
    orderCount: 2,
    receivableAmount: 130
  });
});

test("sales form UI includes customer receivables without direct browser table writes", () => {
  const client = readFileSync(join(root, "app", "sales", "SalesFormClient.js"), "utf8");

  assert.match(client, /getReceivableRows/);
  assert.match(client, /客户应收款/);
  assert.match(client, /应收/);
  assert.doesNotMatch(client, /supabase\.from|\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});
