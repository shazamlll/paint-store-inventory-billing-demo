import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getSearchSummary,
  searchLocalRecords
} from "../src/search.js";
import { seedCustomers } from "./fixtures/catalog.js";
import { seedProducts } from "./fixtures/catalog.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const savedOrders = [
  savedOrder("SO-20260623-001", "散客", "2026-06-23", 58, "partial"),
  savedOrder("SO-20260623-002", "北区施工队", "2026-06-23", 15, "paid"),
  savedOrder("SO-20260622-001", "常客施工队甲", "2026-06-22", 36, "unpaid")
];

test("Day 021 searches products, customers, and sales orders case-insensitively", () => {
  const results = searchLocalRecords({
    products: seedProducts,
    customers: seedCustomers,
    savedOrders,
    query: "施工"
  });

  assert.deepEqual(results.map((result) => `${result.type}:${result.title}`), [
    "customer:常客施工队甲",
    "customer:南岭翻新队",
    "order:SO-20260623-002",
    "order:SO-20260622-001"
  ]);
});

test("Day 021 matches product name, spec, and order number", () => {
  const productResults = searchLocalRecords({
    products: seedProducts,
    customers: seedCustomers,
    savedOrders,
    query: "半光"
  });
  const orderResults = searchLocalRecords({
    products: seedProducts,
    customers: seedCustomers,
    savedOrders,
    query: "002"
  });

  assert.deepEqual(productResults.map((result) => result.title), [
    "外墙漆",
    "外墙漆"
  ]);
  assert.deepEqual(orderResults.map((result) => result.title), [
    "SO-20260623-002"
  ]);
});

test("Day 021 returns no results for blank search and summarizes result counts", () => {
  const blankResults = searchLocalRecords({
    products: seedProducts,
    customers: seedCustomers,
    savedOrders,
    query: " "
  });
  const summary = getSearchSummary([
    { type: "product" },
    { type: "customer" },
    { type: "order" },
    { type: "order" }
  ]);

  assert.deepEqual(blankResults, []);
  assert.deepEqual(summary, {
    totalResults: 4,
    productCount: 1,
    customerCount: 1,
    orderCount: 2
  });
});

test("Day 021 creates a database-backed search route without direct Supabase writes", () => {
  const pagePath = join(root, "app", "search", "page.js");

  assert.ok(existsSync(pagePath), "app/search/page.js is missing");

  const page = readFileSync(pagePath, "utf8");

  assert.match(page, /searchDatabaseRecords/);
  assert.match(page, /useDatabasePageData/);
  assert.match(page, /全局搜索/);
  assert.match(page, /商品/);
  assert.match(page, /客户/);
  assert.match(page, /销售单/);
  assert.doesNotMatch(page, /seedProducts|seedCustomers|supabase\.from|insert\(|update\(/);
});

test("home page links to the search route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/search"));
});

function savedOrder(orderNumber, customerName, orderDate, totalAmount, paymentStatus) {
  return {
    order: {
      orderNumber,
      customerNameSnapshot: customerName,
      orderDate,
      subtotal: totalAmount,
      discountAmount: 0,
      totalAmount,
      paymentAmount: paymentStatus === "paid" ? totalAmount : 0,
      receivableDelta: paymentStatus === "paid" ? 0 : totalAmount,
      paymentStatus,
      notes: ""
    },
    items: []
  };
}
