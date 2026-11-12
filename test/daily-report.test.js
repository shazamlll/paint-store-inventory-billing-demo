import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createDailyReport,
  formatDailyReportMarkdown
} from "../src/daily-report.js";
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
  product("胶带", "1.5 英寸", 10, 3)
];

test("Day 023 creates a local daily report for the selected date", () => {
  const report = createDailyReport({
    savedOrders,
    products,
    reportDate: "2026-06-23"
  });

  assert.deepEqual(report.header, {
    title: "每日结账报告",
    reportDate: "2026-06-23",
    scope: "数据库销售与库存扫描"
  });
  assert.deepEqual(report.summary, {
    orderCount: 2,
    salesAmount: 73,
    collectionAmount: 45,
    receivableAmount: 28,
    lowStockCount: 2,
    belowThresholdCount: 1,
    atThresholdCount: 1
  });
  assert.deepEqual(report.salesRows.map((row) => row.orderNumber), [
    "SO-20260623-002",
    "SO-20260623-001"
  ]);
  assert.deepEqual(report.lowStockRows.map((row) => `${row.productName}:${row.statusLabel}`), [
    "底漆:低于预警线",
    "刷子:刚到预警线"
  ]);
});

test("Day 023 formats the daily report as owner-readable markdown", () => {
  const markdown = formatDailyReportMarkdown(
    createDailyReport({
      savedOrders,
      products,
      reportDate: "2026-06-23"
    })
  );

  assert.match(markdown, /# 每日结账报告 - 2026-06-23/);
  assert.match(markdown, /销售额：¥73\.00/);
  assert.match(markdown, /已收款：¥45\.00/);
  assert.match(markdown, /今日应收：¥28\.00/);
  assert.match(markdown, /SO-20260623-002 \| 北区施工队 \| ¥15\.00 \| 已收清/);
  assert.match(markdown, /底漆 1 加仑 \| 库存 2 个 \| 低于预警线/);
});

test("Day 023 creates a local daily report route without Supabase writes", () => {
  const pagePath = join(root, "app", "reports", "daily", "page.js");

  assert.ok(existsSync(pagePath), "app/reports/daily/page.js is missing");

  const page = readFileSync(pagePath, "utf8");

  assert.match(page, /createDailyReport/);
  assert.match(page, /formatDailyReportMarkdown/);
  assert.match(page, /每日结账导出/);
  assert.match(page, /Markdown 报表/);
  assert.match(page, /打印报表/);
  assert.match(page, /@media print/);
  assert.doesNotMatch(page, /createBrowserSupabaseClient|supabase\.from|insert\(|update\(/);
});

test("home page links to the daily report route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/reports/daily"));
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
