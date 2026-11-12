import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  addPurchaseLine,
  calculatePurchaseDraftTotals,
  createPurchaseDraft,
  createPurchaseLine,
  createPurchaseOrderNumber,
  removePurchaseLine,
  savePurchaseOrder,
  updatePurchaseLineQuantity,
  validatePurchaseDraft
} from "../src/purchase-form.js";
import { seedProducts } from "./fixtures/catalog.js";
import { seedSuppliers } from "./fixtures/catalog.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Day 015 creates a local purchase receiving draft from supplier and product catalogs", () => {
  const draft = createPurchaseDraft(seedSuppliers, seedProducts);

  assert.equal(draft.supplier.name, "都会涂料供应");
  assert.equal(draft.lines.length, 1);
  assert.equal(draft.lines[0].productNameSnapshot, seedProducts[0].name);
  assert.equal(draft.lines[0].specSnapshot, seedProducts[0].spec);
  assert.equal(draft.lines[0].unitCost, seedProducts[0].costPrice);
});

test("Day 015 creates purchase line snapshots without mutating products", () => {
  const line = createPurchaseLine(seedProducts[2], { quantity: 6, unitCost: 21.25 });

  assert.deepEqual(line, {
    productNameSnapshot: "外墙漆",
    specSnapshot: "半光 1 加仑",
    unit: "罐",
    quantity: 6,
    unitCost: 21.25,
    lineTotal: 127.5
  });
  assert.equal(seedProducts[2].currentStock, 16);
});

test("Day 015 calculates purchase totals, payment status, and payable delta", () => {
  const lines = [
    createPurchaseLine(seedProducts[0], { quantity: 10 }),
    createPurchaseLine(seedProducts[12], { quantity: 12 })
  ];
  const totals = calculatePurchaseDraftTotals({ lines, paymentAmount: 120 });

  assert.deepEqual(totals, {
    subtotal: 218.4,
    totalAmount: 218.4,
    paymentAmount: 120,
    paymentStatus: "partial",
    payableDelta: 98.4
  });
});

test("Day 015 can append and update local purchase line quantities immutably", () => {
  const first = createPurchaseLine(seedProducts[0], { quantity: 1 });
  const added = addPurchaseLine([first], seedProducts[1]);
  const updated = updatePurchaseLineQuantity(added, 0, 5);

  assert.equal(added.length, 2);
  assert.equal(added[1].productNameSnapshot, seedProducts[1].name);
  assert.equal(updated[0].quantity, 5);
  assert.equal(updated[0].lineTotal, 90);
  assert.equal(added[0].quantity, 1);
});

test("purchase draft can remove one added line immutably", () => {
  const first = createPurchaseLine(seedProducts[0], { quantity: 1 });
  const second = createPurchaseLine(seedProducts[1], { quantity: 2 });
  const third = createPurchaseLine(seedProducts[2], { quantity: 3 });
  const original = [first, second, third];
  const removed = removePurchaseLine(original, 1);

  assert.deepEqual(removed, [first, third]);
  assert.equal(removed.length, 2);
  assert.notEqual(removed, original);
});

test("Day 015 creates a saved purchase receiving document with header and line items", () => {
  const lines = [
    createPurchaseLine(seedProducts[0], { quantity: 10 }),
    createPurchaseLine(seedProducts[12], { quantity: 12 })
  ];
  const result = savePurchaseOrder(
    [],
    {
      supplier: seedSuppliers[0],
      lines,
      paymentAmount: 120,
      notes: "Morning delivery"
    },
    { receivedDate: "2026-06-23" }
  );

  assert.equal(result.savedOrders.length, 1);
  assert.deepEqual(result.savedOrders[0].order, {
    orderNumber: "PO-20260623-001",
    supplierNameSnapshot: "都会涂料供应",
    receivedDate: "2026-06-23",
    subtotal: 218.4,
    totalAmount: 218.4,
    paymentStatus: "partial",
    payableDelta: 98.4,
    paymentAmount: 120,
    notes: "Morning delivery"
  });
  assert.equal(result.savedOrders[0].items.length, 2);
  assert.equal(result.savedOrders[0].items[0].purchaseOrderNumber, "PO-20260623-001");
  assert.equal(result.savedOrders[0].items[0].productNameSnapshot, "内墙乳胶漆");
  assert.equal(result.savedOrders[0].items[1].lineTotal, 38.4);
});

test("Day 015 validates purchase receiving drafts before saving", () => {
  assert.deepEqual(
    validatePurchaseDraft({
      supplier: null,
      lines: [],
      paymentAmount: -1,
      notes: ""
    }),
    {
      supplier: "请选择供应商。",
      lines: "至少需要一条入库明细。",
      paymentAmount: "付款金额不能小于 0。"
    }
  );

  assert.deepEqual(
    validatePurchaseDraft({
      supplier: seedSuppliers[0],
      lines: [createPurchaseLine(seedProducts[0], { quantity: 0 })],
      paymentAmount: 0,
      notes: ""
    }),
    {
      lines: "入库数量必须大于 0。"
    }
  );
});

test("Day 015 purchase order number generation is date scoped and padded", () => {
  assert.equal(createPurchaseOrderNumber("2026-06-23", 1), "PO-20260623-001");
  assert.equal(createPurchaseOrderNumber("2026-06-23", 12), "PO-20260623-012");
});

test("Day 015 creates a purchase receiving route without direct browser table writes", () => {
  const pagePath = join(root, "app", "purchases", "page.js");
  const clientPath = join(root, "app", "purchases", "PurchaseFormClient.js");

  assert.ok(existsSync(pagePath), "app/purchases/page.js is missing");
  assert.ok(existsSync(clientPath), "PurchaseFormClient.js is missing");

  const page = readFileSync(pagePath, "utf8");
  const client = readFileSync(clientPath, "utf8");

  assert.match(page, /PurchaseFormClient/);
  assert.match(client, /initialProducts = \[\]/);
  assert.match(client, /initialSuppliers = \[\]/);
  assert.match(client, /type="text"/);
  assert.match(client, /calculatePurchaseDraftTotals/);
  assert.match(client, /savePurchaseOrder/);
  assert.match(client, /removePurchaseLine/);
  assert.match(client, /删除/);
  assert.match(client, /已保存入库单/);
  assert.match(client, /\/api\/purchases\/orders/);
  assert.doesNotMatch(client, /supabase\.from|\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});

test("purchase receiving UI uses a typed supplier name instead of a supplier dropdown", () => {
  const client = readFileSync(join(root, "app", "purchases", "PurchaseFormClient.js"), "utf8");

  assert.match(client, /supplierName\.trim\(\)/);
  assert.match(client, /placeholder="请输入供应商名称"/);
  assert.doesNotMatch(client, /initialSuppliers\.map\(\(supplier\)/);
});

test("home page links to the purchase receiving route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/purchases"));
});
