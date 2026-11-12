import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyPurchaseOrderToInventory,
  findProductForPurchaseItem,
  validatePurchaseOrderReceiving
} from "../src/inventory.js";
import { seedProducts } from "./fixtures/catalog.js";
import {
  createPurchaseLine,
  savePurchaseOrder
} from "../src/purchase-form.js";
import { seedSuppliers } from "./fixtures/catalog.js";

const root = fileURLToPath(new URL("..", import.meta.url));

function savedPurchaseOrderFor(lines) {
  return savePurchaseOrder(
    [],
    {
      supplier: seedSuppliers[0],
      lines,
      paymentAmount: 0,
      notes: ""
    },
    { receivedDate: "2026-06-23" }
  ).savedOrder;
}

test("Day 016 matches saved purchase items back to local products by snapshot", () => {
  const item = createPurchaseLine(seedProducts[0], { quantity: 10 });
  const product = findProductForPurchaseItem(seedProducts, item);

  assert.equal(product.name, "内墙乳胶漆");
  assert.equal(product.spec, "白色 1 加仑");
});

test("Day 016 validates missing products before receiving stock", () => {
  const missingOrder = savedPurchaseOrderFor([
    {
      productNameSnapshot: "Missing Paint",
      specSnapshot: "1 加仑",
      unit: "罐",
      quantity: 1,
      unitCost: 10,
      lineTotal: 10
    }
  ]);

  assert.deepEqual(validatePurchaseOrderReceiving(seedProducts, missingOrder), {
    inventory: "未找到明细对应商品：Missing Paint 1 加仑。"
  });
});

test("Day 016 aggregates repeated purchase lines before receiving stock", () => {
  const savedOrder = savedPurchaseOrderFor([
    createPurchaseLine(seedProducts[0], { quantity: 10 }),
    createPurchaseLine(seedProducts[0], { quantity: 5 })
  ]);
  const result = applyPurchaseOrderToInventory(seedProducts, savedOrder);

  assert.deepEqual(result.errors, {});
  assert.equal(result.products[0].currentStock, 39);
  assert.equal(result.movements.length, 1);
  assert.equal(result.movements[0].quantityDelta, 15);
  assert.equal(result.movements[0].stockAfter, 39);
});

test("Day 016 receives local stock and creates purchase inventory movements", () => {
  const savedOrder = savedPurchaseOrderFor([
    createPurchaseLine(seedProducts[0], { quantity: 10 }),
    createPurchaseLine(seedProducts[12], { quantity: 12 })
  ]);
  const result = applyPurchaseOrderToInventory(seedProducts, savedOrder);

  assert.deepEqual(result.errors, {});
  assert.equal(result.products[0].currentStock, 34);
  assert.equal(result.products[12].currentStock, 52);
  assert.equal(seedProducts[0].currentStock, 24);
  assert.deepEqual(result.movements, [
    {
      productNameSnapshot: "内墙乳胶漆",
      specSnapshot: "白色 1 加仑",
      movementType: "purchase",
      quantityDelta: 10,
      stockAfter: 34,
      sourceTable: "purchase_orders",
      sourceOrderNumber: "PO-20260623-001",
      notes: "Purchase receiving stock movement"
    },
    {
      productNameSnapshot: "滚筒刷",
      specSnapshot: "9 英寸",
      movementType: "purchase",
      quantityDelta: 12,
      stockAfter: 52,
      sourceTable: "purchase_orders",
      sourceOrderNumber: "PO-20260623-001",
      notes: "Purchase receiving stock movement"
    }
  ]);
});

test("purchase receiving UI validates stock receiving before server transaction without direct browser table writes", () => {
  const client = readFileSync(join(root, "app", "purchases", "PurchaseFormClient.js"), "utf8");

  assert.match(client, /validatePurchaseOrderReceiving/);
  assert.match(client, /\/api\/purchases\/orders/);
  assert.match(client, /onSaved/);
  assert.match(client, /库存流水/);
  assert.match(client, /stock/);
  assert.doesNotMatch(client, /supabase\.from|\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});
