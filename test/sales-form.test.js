import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  addSalesLine,
  calculateSalesDraftTotals,
  createSalesOrderNumber,
  createSalesDraft,
  createSalesLine,
  getPaymentStatus,
  removeSalesLine,
  saveSalesOrder,
  validateSalesDraft,
  updateSalesLineQuantity
} from "../src/sales-form.js";
import { seedCustomers } from "./fixtures/catalog.js";
import { seedProducts } from "./fixtures/catalog.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Day 009 creates a local sales draft from customer and product catalogs", () => {
  const draft = createSalesDraft(seedCustomers, seedProducts);

  assert.equal(draft.customer.name, "散客");
  assert.equal(draft.lines.length, 1);
  assert.equal(draft.lines[0].productNameSnapshot, seedProducts[0].name);
  assert.equal(draft.lines[0].specSnapshot, seedProducts[0].spec);
  assert.equal(draft.lines[0].unitPrice, seedProducts[0].salePrice);
});

test("Day 009 creates sales line snapshots without mutating products", () => {
  const line = createSalesLine(seedProducts[2], { quantity: 3, discountAmount: 2 });

  assert.deepEqual(line, {
    productNameSnapshot: "外墙漆",
    specSnapshot: "半光 1 加仑",
    unit: "罐",
    quantity: 3,
    unitPrice: 36,
    discountAmount: 2,
    lineTotal: 106
  });
  assert.equal(seedProducts[2].currentStock, 16);
});

test("Day 009 calculates subtotal, discount, total, payment status, and receivable delta", () => {
  const lines = [
    createSalesLine(seedProducts[0], { quantity: 2, discountAmount: 3 }),
    createSalesLine(seedProducts[12], { quantity: 4, discountAmount: 0 })
  ];
  const totals = calculateSalesDraftTotals({ lines, paymentAmount: 40 });

  assert.deepEqual(totals, {
    subtotal: 88,
    discountAmount: 3,
    totalAmount: 85,
    paymentAmount: 40,
    paymentStatus: "partial",
    receivableDelta: 45
  });
});

test("Day 009 payment status covers paid, partial, and unpaid states", () => {
  assert.equal(getPaymentStatus(85, 85), "paid");
  assert.equal(getPaymentStatus(85, 0), "unpaid");
  assert.equal(getPaymentStatus(85, 10), "partial");
});

test("Day 009 can append and update local line quantities immutably", () => {
  const first = createSalesLine(seedProducts[0], { quantity: 1 });
  const added = addSalesLine([first], seedProducts[1]);
  const updated = updateSalesLineQuantity(added, 0, 5);

  assert.equal(added.length, 2);
  assert.equal(added[1].productNameSnapshot, seedProducts[1].name);
  assert.equal(updated[0].quantity, 5);
  assert.equal(updated[0].lineTotal, 145);
  assert.equal(added[0].quantity, 1);
});

test("sales draft can remove one added line immutably", () => {
  const first = createSalesLine(seedProducts[0], { quantity: 1 });
  const second = createSalesLine(seedProducts[1], { quantity: 2 });
  const third = createSalesLine(seedProducts[2], { quantity: 3 });
  const original = [first, second, third];
  const removed = removeSalesLine(original, 1);

  assert.deepEqual(removed, [first, third]);
  assert.equal(removed.length, 2);
  assert.notEqual(removed, original);
});

test("Day 010 creates a saved sales order document with header and line items", () => {
  const lines = [
    createSalesLine(seedProducts[0], { quantity: 2, discountAmount: 3 }),
    createSalesLine(seedProducts[12], { quantity: 4 })
  ];
  const result = saveSalesOrder(
    [],
    {
      customer: seedCustomers[0],
      lines,
      paymentAmount: 40,
      notes: "Pickup after 5pm"
    },
    { orderDate: "2026-06-23" }
  );

  assert.equal(result.savedOrders.length, 1);
  assert.deepEqual(result.savedOrders[0].order, {
    orderNumber: "SO-20260623-001",
    customerNameSnapshot: "常客施工队甲",
    orderDate: "2026-06-23",
    subtotal: 88,
    discountAmount: 3,
    totalAmount: 85,
    paymentStatus: "partial",
    receivableDelta: 45,
    paymentAmount: 40,
    notes: "Pickup after 5pm"
  });
  assert.equal(result.savedOrders[0].items.length, 2);
  assert.equal(result.savedOrders[0].items[0].salesOrderNumber, "SO-20260623-001");
  assert.equal(result.savedOrders[0].items[0].productNameSnapshot, "内墙乳胶漆");
  assert.equal(result.savedOrders[0].items[1].lineTotal, 30);
});

test("Day 010 appends saved orders immutably and increments order numbers", () => {
  const first = saveSalesOrder(
    [],
    {
      customer: seedCustomers[4],
      lines: [createSalesLine(seedProducts[0])],
      paymentAmount: 29,
      notes: ""
    },
    { orderDate: "2026-06-23" }
  );
  const second = saveSalesOrder(
    first.savedOrders,
    {
      customer: seedCustomers[1],
      lines: [createSalesLine(seedProducts[1])],
      paymentAmount: 0,
      notes: "Credit sale"
    },
    { orderDate: "2026-06-23" }
  );

  assert.equal(first.savedOrders.length, 1);
  assert.equal(second.savedOrders.length, 2);
  assert.equal(second.savedOrders[1].order.orderNumber, "SO-20260623-002");
  assert.equal(first.savedOrders.length, 1);
});

test("Day 010 validates sales drafts before saving", () => {
  assert.deepEqual(
    validateSalesDraft({
      customer: null,
      lines: [],
      paymentAmount: -1,
      notes: ""
    }),
    {
      customer: "请选择客户。",
      lines: "至少需要一条商品明细。",
      paymentAmount: "收款金额不能小于 0。"
    }
  );

  assert.deepEqual(
    validateSalesDraft({
      customer: seedCustomers[0],
      lines: [createSalesLine(seedProducts[0], { quantity: 0 })],
      paymentAmount: 0,
      notes: ""
    }),
    {
      lines: "商品数量必须大于 0。"
    }
  );

  assert.deepEqual(
    validateSalesDraft({
      customer: seedCustomers[0],
      lines: [createSalesLine(seedProducts[0], { quantity: 1 })],
      paymentAmount: seedProducts[0].salePrice + 1,
      notes: ""
    }),
    {
      paymentAmount: "本次收款不能大于销售合计。"
    }
  );
});

test("Day 010 order number generation is date scoped and padded", () => {
  assert.equal(createSalesOrderNumber("2026-06-23", 1), "SO-20260623-001");
  assert.equal(createSalesOrderNumber("2026-06-23", 12), "SO-20260623-012");
});

test("Day 009 creates a sales form route without direct browser table writes", () => {
  const pagePath = join(root, "app", "sales", "page.js");
  const clientPath = join(root, "app", "sales", "SalesFormClient.js");

  assert.ok(existsSync(pagePath), "app/sales/page.js is missing");
  assert.ok(existsSync(clientPath), "SalesFormClient.js is missing");

  const page = readFileSync(pagePath, "utf8");
  const client = readFileSync(clientPath, "utf8");

  assert.match(page, /SalesFormClient/);
  assert.match(client, /initialCustomers = \[\]/);
  assert.match(client, /initialProducts = \[\]/);
  assert.match(client, /calculateSalesDraftTotals/);
  assert.match(client, /saveSalesOrder/);
  assert.match(client, /removeSalesLine/);
  assert.match(client, /删除/);
  assert.match(client, /已保存销售单/);
  assert.match(client, /\/api\/sales\/orders/);
  assert.doesNotMatch(client, /supabase\.from|\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});

test("home page links to the sales form route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/sales"));
});
