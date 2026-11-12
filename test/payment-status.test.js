import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createPaymentDraftFromSalesOrder,
  getPaymentStatusSummary,
  getPaymentStatusTone
} from "../src/payment-status.js";
import {
  createSalesLine,
  saveSalesOrder
} from "../src/sales-form.js";
import { seedCustomers } from "./fixtures/catalog.js";
import { seedProducts } from "./fixtures/catalog.js";

const root = fileURLToPath(new URL("..", import.meta.url));

function savedOrder(paymentAmount, options = {}) {
  return saveSalesOrder(
    [],
    {
      customer: options.customer ?? seedCustomers[0],
      lines: [
        createSalesLine(seedProducts[0], { quantity: 2, discountAmount: 3 }),
        createSalesLine(seedProducts[12], { quantity: 4 })
      ],
      paymentAmount,
      notes: options.notes ?? ""
    },
    {
      orderDate: "2026-06-23",
      orderNumber: options.orderNumber
    }
  ).savedOrder;
}

test("Day 013 summarizes saved orders by paid, partial, and unpaid status", () => {
  const summary = getPaymentStatusSummary([
    savedOrder(85, { orderNumber: "SO-20260623-001" }),
    savedOrder(40, { orderNumber: "SO-20260623-002" }),
    savedOrder(0, { orderNumber: "SO-20260623-003" })
  ]);

  assert.deepEqual(summary.totals, {
    orderCount: 3,
    totalAmount: 255,
    paymentAmount: 125,
    receivableAmount: 130
  });
  assert.deepEqual(summary.byStatus, {
    paid: {
      label: "已收清",
      orderCount: 1,
      totalAmount: 85,
      paymentAmount: 85,
      receivableAmount: 0
    },
    partial: {
      label: "部分收款",
      orderCount: 1,
      totalAmount: 85,
      paymentAmount: 40,
      receivableAmount: 45
    },
    unpaid: {
      label: "未收款",
      orderCount: 1,
      totalAmount: 85,
      paymentAmount: 0,
      receivableAmount: 85
    }
  });
});

test("Day 013 creates a local payment draft from a saved order", () => {
  const draft = createPaymentDraftFromSalesOrder(
    savedOrder(40, {
      orderNumber: "SO-20260623-002",
      customer: seedCustomers[1],
      notes: "Credit sale"
    })
  );

  assert.deepEqual(draft, {
    sourceTable: "sales_orders",
    sourceOrderNumber: "SO-20260623-002",
    customerNameSnapshot: "社区业主",
    paymentDate: "2026-06-23",
    amount: 40,
    paymentStatus: "partial",
    receivableAfterPayment: 45,
    notes: "Credit sale"
  });
});

test("Day 013 payment status tones are stable for UI badges", () => {
  assert.equal(getPaymentStatusTone("paid"), "settled");
  assert.equal(getPaymentStatusTone("partial"), "watch");
  assert.equal(getPaymentStatusTone("unpaid"), "risk");
  assert.equal(getPaymentStatusTone("unknown"), "neutral");
});

test("sales form UI includes payment status scanning without direct browser table writes", () => {
  const client = readFileSync(join(root, "app", "sales", "SalesFormClient.js"), "utf8");

  assert.match(client, /getPaymentStatusSummary/);
  assert.match(client, /收款状态/);
  assert.match(client, /应收款/);
  assert.doesNotMatch(client, /supabase\.from|\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});
