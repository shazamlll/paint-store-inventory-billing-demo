import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getLowStockAlertRows,
  getLowStockAlertSummary
} from "../src/low-stock-alerts.js";
import { seedProducts } from "./fixtures/catalog.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Day 018 filters products at or below their low-stock threshold", () => {
  const rows = getLowStockAlertRows([
    product("底漆", "1 加仑", "罐", 2, 5),
    product("刷子", "2 英寸", "个", 4, 4),
    product("Tape", "1.5 inch", "卷", 10, 3)
  ]);

  assert.deepEqual(rows, [
    {
      productName: "底漆",
      spec: "1 加仑",
      unit: "罐",
      currentStock: 2,
      lowStockThreshold: 5,
      stockGap: 3,
      statusLabel: "低于预警线"
    },
    {
      productName: "刷子",
      spec: "2 英寸",
      unit: "个",
      currentStock: 4,
      lowStockThreshold: 4,
      stockGap: 0,
      statusLabel: "刚到预警线"
    }
  ]);
});

test("Day 018 summarizes low-stock risk for owner scanning", () => {
  const summary = getLowStockAlertSummary([
    product("底漆", "1 加仑", "罐", 2, 5),
    product("刷子", "2 英寸", "个", 4, 4),
    product("Tape", "1.5 inch", "卷", 10, 3)
  ]);

  assert.deepEqual(summary, {
    lowStockCount: 2,
    belowThresholdCount: 1,
    atThresholdCount: 1,
    totalStockGap: 3
  });
});

test("Day 018 seed data includes at least one local low-stock alert", () => {
  const rows = getLowStockAlertRows(seedProducts);

  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => row.currentStock <= row.lowStockThreshold));
});

test("Day 018 creates a local low-stock alert route without Supabase writes", () => {
  const pagePath = join(root, "app", "inventory", "low-stock", "page.js");

  assert.ok(existsSync(pagePath), "app/inventory/low-stock/page.js is missing");

  const page = readFileSync(pagePath, "utf8");

  assert.match(page, /getLowStockAlertRows/);
  assert.match(page, /低库存提醒/);
  assert.match(page, /低于预警线/);
  assert.match(page, /刚到预警线/);
  assert.doesNotMatch(page, /createBrowserSupabaseClient|supabase\.from|insert\(|update\(/);
});

test("home page links to the low-stock alert route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/inventory/low-stock"));
});

function product(name, spec, unit, currentStock, lowStockThreshold) {
  return {
    name,
    spec,
    unit,
    costPrice: 1,
    salePrice: 2,
    currentStock,
    lowStockThreshold
  };
}
