import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getDashboardSummary,
  getTodaySalesRows
} from "../src/dashboard.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

const savedOrders = [
  savedOrder("SO-20260623-001", "散客", "2026-06-23", 58, 30, 28, "partial"),
  savedOrder("SO-20260623-002", "北区施工队", "2026-06-23", 15, 15, 0, "paid"),
  savedOrder("SO-20260622-001", "北区施工队", "2026-06-22", 36, 0, 36, "unpaid")
];

const products = [
  product("底漆", "1 加仑", 2, 5),
  product("刷子", "2 英寸", 4, 4),
  product("Tape", "1.5 inch", 10, 3)
];

test("Day 020 summarizes today's sales, collection, receivables, and low stock", () => {
  const summary = getDashboardSummary({
    savedOrders,
    products,
    todayDate: "2026-06-23"
  });

  assert.deepEqual(summary, {
    todayOrderCount: 2,
    todaySalesAmount: 73,
    todayCollectionAmount: 45,
    receivableAmount: 64,
    receivableCustomerCount: 2,
    lowStockCount: 2
  });
});

test("Day 020 exposes today's sales rows in newest order order", () => {
  const rows = getTodaySalesRows(savedOrders, "2026-06-23");

  assert.deepEqual(rows, [
    {
      orderNumber: "SO-20260623-002",
      customerName: "北区施工队",
      totalAmount: 15,
      paymentAmount: 15,
      receivableDelta: 0,
      paymentStatus: "paid"
    },
    {
      orderNumber: "SO-20260623-001",
      customerName: "散客",
      totalAmount: 58,
      paymentAmount: 30,
      receivableDelta: 28,
      paymentStatus: "partial"
    }
  ]);
});

test("Day 020 creates a local dashboard route without Supabase writes", () => {
  const pagePath = join(root, "app", "dashboard", "page.js");

  assert.ok(existsSync(pagePath), "app/dashboard/page.js is missing");

  const page = readFileSync(pagePath, "utf8");

  assert.match(page, /getDashboardSummary/);
  assert.match(page, /今日销售/);
  assert.match(page, /Collection/);
  assert.match(page, /应收款/);
  assert.match(page, /低库存/);
  assert.doesNotMatch(page, /createBrowserSupabaseClient|supabase\.from|insert\(|update\(/);
});

test("home page links to the dashboard route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/dashboard"));
});

function savedOrder(orderNumber, customerName, orderDate, totalAmount, paymentAmount, receivableDelta, paymentStatus) {
  return {
    order: {
      orderNumber,
      customerNameSnapshot: customerName,
      orderDate,
      subtotal: totalAmount,
      discountAmount: 0,
      totalAmount,
      paymentAmount,
      receivableDelta,
      paymentStatus,
      notes: ""
    },
    items: []
  };
}

function product(name, spec, currentStock, lowStockThreshold) {
  return {
    name,
    spec,
    unit: "个",
    costPrice: 1,
    salePrice: 2,
    currentStock,
    lowStockThreshold
  };
}
