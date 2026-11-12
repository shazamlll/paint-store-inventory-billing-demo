import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applySalesOrderToInventory,
  findProductForSalesItem,
  getInventoryMovementSummary,
  validateSalesOrderInventory
} from "../src/inventory.js";
import { seedProducts } from "./fixtures/catalog.js";
import {
  createSalesLine,
  saveSalesOrder
} from "../src/sales-form.js";
import { seedCustomers } from "./fixtures/catalog.js";

const root = fileURLToPath(new URL("..", import.meta.url));

function savedOrderFor(lines) {
  return saveSalesOrder(
    [],
    {
      customer: seedCustomers[4],
      lines,
      paymentAmount: 0,
      notes: ""
    },
    { orderDate: "2026-06-23" }
  ).savedOrder;
}

test("Day 011 matches saved sales items back to local products by snapshot", () => {
  const item = createSalesLine(seedProducts[0], { quantity: 2 });
  const product = findProductForSalesItem(seedProducts, item);

  assert.equal(product.name, "内墙乳胶漆");
  assert.equal(product.spec, "白色 1 加仑");
});

test("Day 011 validates missing products and insufficient stock before deduction", () => {
  const missingOrder = savedOrderFor([
    {
      productNameSnapshot: "Missing Paint",
      specSnapshot: "1 加仑",
      unit: "罐",
      quantity: 1,
      unitPrice: 10,
      discountAmount: 0,
      lineTotal: 10
    }
  ]);
  const insufficientOrder = savedOrderFor([
    createSalesLine(seedProducts[0], { quantity: 999 })
  ]);

  assert.deepEqual(validateSalesOrderInventory(seedProducts, missingOrder), {
    inventory: "未找到明细对应商品：Missing Paint 1 加仑。"
  });
  assert.deepEqual(validateSalesOrderInventory(seedProducts, insufficientOrder), {
    inventory: "内墙乳胶漆 白色 1 加仑 库存不足。"
  });
});

test("Day 011 aggregates repeated product lines before validating and deducting stock", () => {
  const savedOrder = savedOrderFor([
    createSalesLine(seedProducts[0], { quantity: 13 }),
    createSalesLine(seedProducts[0], { quantity: 12 })
  ]);

  assert.deepEqual(validateSalesOrderInventory(seedProducts, savedOrder), {
    inventory: "内墙乳胶漆 白色 1 加仑 库存不足。"
  });

  const validOrder = savedOrderFor([
    createSalesLine(seedProducts[0], { quantity: 2 }),
    createSalesLine(seedProducts[0], { quantity: 3 })
  ]);
  const result = applySalesOrderToInventory(seedProducts, validOrder);

  assert.equal(result.products[0].currentStock, 19);
  assert.equal(result.movements[0].quantityDelta, -5);
  assert.equal(result.movements[0].stockAfter, 19);
});

test("Day 011 deducts stock and creates inventory movements from a saved order", () => {
  const savedOrder = savedOrderFor([
    createSalesLine(seedProducts[0], { quantity: 2 }),
    createSalesLine(seedProducts[12], { quantity: 4 })
  ]);
  const result = applySalesOrderToInventory(seedProducts, savedOrder);

  assert.deepEqual(result.errors, {});
  assert.equal(result.products[0].currentStock, 22);
  assert.equal(result.products[12].currentStock, 36);
  assert.equal(seedProducts[0].currentStock, 24);
  assert.deepEqual(result.movements, [
    {
      productNameSnapshot: "内墙乳胶漆",
      specSnapshot: "白色 1 加仑",
      movementType: "sale",
      quantityDelta: -2,
      stockAfter: 22,
      sourceTable: "sales_orders",
      sourceOrderNumber: "SO-20260623-001",
      notes: "Sales order stock movement"
    },
    {
      productNameSnapshot: "滚筒刷",
      specSnapshot: "9 英寸",
      movementType: "sale",
      quantityDelta: -4,
      stockAfter: 36,
      sourceTable: "sales_orders",
      sourceOrderNumber: "SO-20260623-001",
      notes: "Sales order stock movement"
    }
  ]);
});

test("Day 011 inventory movement summary supports owner scanning", () => {
  const savedOrder = savedOrderFor([
    createSalesLine(seedProducts[0], { quantity: 2 }),
    createSalesLine(seedProducts[12], { quantity: 4 })
  ]);
  const result = applySalesOrderToInventory(seedProducts, savedOrder);
  const summary = getInventoryMovementSummary(result.movements);

  assert.deepEqual(summary, {
    movementCount: 2,
    totalUnitsDeducted: 6,
    latestSourceOrderNumber: "SO-20260623-001"
  });
});

test("sales form UI validates inventory before server transaction without direct browser table writes", () => {
  const client = readFileSync(join(root, "app", "sales", "SalesFormClient.js"), "utf8");

  assert.match(client, /validateSalesOrderInventory/);
  assert.match(client, /\/api\/sales\/orders/);
  assert.match(client, /onSaved/);
  assert.match(client, /库存流水/);
  assert.doesNotMatch(client, /supabase\.from|\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});
