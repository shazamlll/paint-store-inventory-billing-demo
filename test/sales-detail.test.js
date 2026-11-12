import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createPrintableSalesOrderDetail,
  getSalesOrderDetailStatusLabel
} from "../src/sales-detail.js";
import {
  createSalesLine,
  saveSalesOrder
} from "../src/sales-form.js";
import { seedCustomers } from "./fixtures/catalog.js";
import { seedProducts } from "./fixtures/catalog.js";

const root = fileURLToPath(new URL("..", import.meta.url));

function savedOrderFixture() {
  return saveSalesOrder(
    [],
    {
      customer: seedCustomers[0],
      lines: [
        createSalesLine(seedProducts[0], { quantity: 2, discountAmount: 3 }),
        createSalesLine(seedProducts[12], { quantity: 4 })
      ],
      paymentAmount: 40,
      notes: "下午 5 点后自提"
    },
    { orderDate: "2026-06-23" }
  ).savedOrder;
}

test("Day 012 creates a printable sales order detail from a saved local order", () => {
  const detail = createPrintableSalesOrderDetail(savedOrderFixture());

  assert.deepEqual(detail.header, {
    title: "销售单",
    orderNumber: "SO-20260623-001",
    customer: "常客施工队甲",
    orderDate: "2026-06-23",
    paymentStatus: "部分收款"
  });
  assert.deepEqual(detail.totals, {
    subtotal: 88,
    discountAmount: 3,
    totalAmount: 85,
    paymentAmount: 40,
    receivableDelta: 45,
    itemCount: 2,
    totalQuantity: 6
  });
  assert.deepEqual(detail.lines[0], {
    lineNumber: 1,
    product: "内墙乳胶漆",
    spec: "白色 1 加仑",
    unit: "罐",
    quantity: 2,
    unitPrice: 29,
    discountAmount: 3,
    lineTotal: 55
  });
  assert.equal(detail.notes, "下午 5 点后自提");
});

test("Day 012 payment labels are owner-readable", () => {
  assert.equal(getSalesOrderDetailStatusLabel("paid"), "已收清");
  assert.equal(getSalesOrderDetailStatusLabel("partial"), "部分收款");
  assert.equal(getSalesOrderDetailStatusLabel("unpaid"), "未收款");
  assert.equal(getSalesOrderDetailStatusLabel("unknown"), "待确认");
});

test("sales form UI includes a local sales detail review and print action", () => {
  const clientPath = join(root, "app", "sales", "SalesFormClient.js");

  assert.ok(existsSync(clientPath), "SalesFormClient.js is missing");

  const client = readFileSync(clientPath, "utf8");

  assert.match(client, /createPrintableSalesOrderDetail/);
  assert.match(client, /销售单明细/);
  assert.match(client, /打印单据/);
  assert.match(client, /window\.print/);
  assert.doesNotMatch(client, /supabase\.from|\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});
