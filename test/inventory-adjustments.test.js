import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyManualInventoryAdjustment,
  createManualAdjustmentDraft,
  validateManualAdjustmentDraft
} from "../src/inventory-adjustments.js";
import { seedProducts } from "./fixtures/catalog.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Day 019 creates a manual adjustment draft from a selected product", () => {
  const draft = createManualAdjustmentDraft(seedProducts, seedProducts[0]);

  assert.deepEqual(draft, {
    productNameSnapshot: "内墙乳胶漆",
    specSnapshot: "白色 1 加仑",
    unit: "罐",
    quantityDelta: "0",
    reason: ""
  });
});

test("Day 019 validates manual adjustment product, quantity, resulting stock, and reason", () => {
  assert.deepEqual(
    validateManualAdjustmentDraft(seedProducts, {
      productNameSnapshot: "Missing Paint",
      specSnapshot: "1 加仑",
      unit: "罐",
      quantityDelta: "1",
      reason: "Found extra can"
    }),
    {
      product: "未找到要调整的商品：Missing Paint 1 加仑。"
    }
  );

  assert.deepEqual(
    validateManualAdjustmentDraft(seedProducts, {
      productNameSnapshot: seedProducts[0].name,
      specSnapshot: seedProducts[0].spec,
      unit: seedProducts[0].unit,
      quantityDelta: "0",
      reason: "No change"
    }),
    {
      quantityDelta: "调整数量不能为 0。"
    }
  );

  assert.deepEqual(
    validateManualAdjustmentDraft(seedProducts, {
      productNameSnapshot: seedProducts[0].name,
      specSnapshot: seedProducts[0].spec,
      unit: seedProducts[0].unit,
      quantityDelta: "-25",
      reason: "Damaged cans"
    }),
    {
      quantityDelta: "调整后库存不能为负数。"
    }
  );

  assert.deepEqual(
    validateManualAdjustmentDraft(seedProducts, {
      productNameSnapshot: seedProducts[0].name,
      specSnapshot: seedProducts[0].spec,
      unit: seedProducts[0].unit,
      quantityDelta: "2",
      reason: " "
    }),
    {
      reason: "请填写调整原因。"
    }
  );
});

test("Day 019 applies a manual adjustment and creates an inventory movement", () => {
  const result = applyManualInventoryAdjustment(
    seedProducts,
    {
      productNameSnapshot: seedProducts[0].name,
      specSnapshot: seedProducts[0].spec,
      unit: seedProducts[0].unit,
      quantityDelta: "-3",
      reason: "Damaged cans found during shelf count"
    },
    { adjustmentDate: "2026-06-23" }
  );

  assert.deepEqual(result.errors, {});
  assert.equal(result.products[0].currentStock, 21);
  assert.equal(seedProducts[0].currentStock, 24);
  assert.deepEqual(result.movement, {
    productNameSnapshot: "内墙乳胶漆",
    specSnapshot: "白色 1 加仑",
    movementType: "adjustment",
    quantityDelta: -3,
    stockAfter: 21,
    sourceTable: "manual_adjustments",
    sourceOrderNumber: "ADJ-20260623-001",
    notes: "手动调整：Damaged cans found during shelf count"
  });
});

test("Day 019 creates a database-backed manual adjustment route", () => {
  const pagePath = join(root, "app", "inventory", "adjustments", "page.js");
  const clientPath = join(root, "app", "inventory", "adjustments", "InventoryAdjustmentClient.js");

  assert.ok(existsSync(pagePath), "app/inventory/adjustments/page.js is missing");
  assert.ok(existsSync(clientPath), "InventoryAdjustmentClient.js is missing");

  const page = readFileSync(pagePath, "utf8");
  const client = readFileSync(clientPath, "utf8");

  assert.match(page, /InventoryAdjustmentClient/);
  assert.match(page, /useDatabasePageData/);
  assert.match(client, /\/api\/inventory\/adjustments/);
  assert.match(client, /手工库存调整/);
  assert.match(client, /原因/);
  assert.doesNotMatch(`${page}\n${client}`, /seedProducts|已本地保存/);
});

test("home page links to the manual adjustment route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/inventory/adjustments"));
});
