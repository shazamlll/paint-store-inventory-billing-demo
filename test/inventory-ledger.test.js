import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getInventoryLedgerRows,
  getInventoryLedgerSummary,
  getProductMovementHistory
} from "../src/inventory-ledger.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

const movements = [
  movement("内墙乳胶漆", "白色 1 加仑", "sale", -2, 22, "SO-20260623-001"),
  movement("滚筒刷", "9 英寸", "sale", -4, 36, "SO-20260623-001"),
  movement("内墙乳胶漆", "白色 1 加仑", "purchase", 10, 32, "PO-20260623-001"),
  movement("内墙乳胶漆", "白色 1 加仑", "sale", -1, 31, "SO-20260623-002")
];

test("Day 017 groups local inventory movements by product ledger row", () => {
  const rows = getInventoryLedgerRows(movements);

  assert.deepEqual(rows, [
    {
      productName: "内墙乳胶漆",
      spec: "白色 1 加仑",
      movementCount: 3,
      totalIn: 10,
      totalOut: 3,
      netChange: 7,
      lastStockAfter: 31,
      latestSourceOrderNumber: "SO-20260623-002"
    },
    {
      productName: "滚筒刷",
      spec: "9 英寸",
      movementCount: 1,
      totalIn: 0,
      totalOut: 4,
      netChange: -4,
      lastStockAfter: 36,
      latestSourceOrderNumber: "SO-20260623-001"
    }
  ]);
});

test("Day 017 summarizes inventory ledger for owner scanning", () => {
  const summary = getInventoryLedgerSummary(movements);

  assert.deepEqual(summary, {
    productCount: 2,
    movementCount: 4,
    totalIn: 10,
    totalOut: 7,
    netChange: 3
  });
});

test("Day 017 exposes movement history for a selected product", () => {
  const history = getProductMovementHistory(movements, {
    productName: "内墙乳胶漆",
    spec: "白色 1 加仑"
  });

  assert.deepEqual(history.map((movementItem) => movementItem.sourceOrderNumber), [
    "SO-20260623-001",
    "PO-20260623-001",
    "SO-20260623-002"
  ]);
});

test("Day 017 creates a local inventory ledger route without Supabase writes", () => {
  const pagePath = join(root, "app", "inventory", "page.js");

  assert.ok(existsSync(pagePath), "app/inventory/page.js is missing");

  const page = readFileSync(pagePath, "utf8");

  assert.match(page, /getInventoryLedgerRows/);
  assert.match(page, /库存流水/);
  assert.match(page, /变动历史/);
  assert.match(page, /净变化/);
  assert.doesNotMatch(page, /createBrowserSupabaseClient|supabase\.from|insert\(|update\(/);
});

test("home page links to the inventory ledger route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/inventory"));
});

function movement(productNameSnapshot, specSnapshot, movementType, quantityDelta, stockAfter, sourceOrderNumber) {
  return {
    productNameSnapshot,
    specSnapshot,
    movementType,
    quantityDelta,
    stockAfter,
    sourceTable: movementType === "sale" ? "sales_orders" : "purchase_orders",
    sourceOrderNumber,
    notes: ""
  };
}
