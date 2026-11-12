import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getProductStockStatus,
  getProductSummary
} from "../src/products.js";
import { seedProducts } from "./fixtures/catalog.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Day 006 exposes the expanded seeded products for local UI work", () => {
  assert.ok(seedProducts.length >= 30);
  assert.deepEqual(Object.keys(seedProducts[0]), [
    "name",
    "spec",
    "unit",
    "costPrice",
    "salePrice",
    "currentStock",
    "lowStockThreshold"
  ]);
});

test("Day 006 computes stock status without requiring Supabase", () => {
  assert.equal(
    getProductStockStatus({ currentStock: 2, lowStockThreshold: 3 }),
    "low"
  );
  assert.equal(
    getProductStockStatus({ currentStock: 3, lowStockThreshold: 3 }),
    "low"
  );
  assert.equal(
    getProductStockStatus({ currentStock: 4, lowStockThreshold: 3 }),
    "ok"
  );
});

test("Day 006 product summary supports inventory scanning", () => {
  const summary = getProductSummary(seedProducts);

  assert.ok(summary.totalProducts >= 30);
  assert.ok(summary.totalStockUnits > 0);
  assert.ok(summary.totalRetailValue > summary.totalCostValue);
  assert.ok(summary.lowStockCount >= 0);
});

test("Day 006 creates a products route backed by database page data", () => {
  const pagePath = join(root, "app", "products", "page.js");
  assert.ok(existsSync(pagePath), "app/products/page.js is missing");

  const page = readFileSync(pagePath, "utf8");
  assert.match(page, /useDatabasePageData/);
  assert.match(page, /createBrowserSupabaseClient/);
  assert.match(page, /getProductSummary/);
  assert.match(page, /数据库商品目录/);
  assert.match(page, /删除/);
  assert.match(page, /\/api\/catalog\/products/);
  assert.match(page, /method:\s*"DELETE"/);
  assert.doesNotMatch(page, /seedProducts|本地样例|样例兜底|\.insert\(|\.update\(|\.delete\(/);
});

test("home page links to the product list route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/products"));
});
