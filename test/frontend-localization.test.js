import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("core frontend pages expose Chinese operational copy", () => {
  const pages = [
    ["app/layout.js", ["门店进销存开单系统", "轻量级开单、库存和应收管理"]],
    ["app/dashboard/page.js", ["今日经营看板", "今日销售", "收款", "应收款", "低库存"]],
    ["app/products/page.js", ["商品列表", "编辑商品", "零售价"]],
    ["app/customers/page.js", ["客户列表", "开单准备", "应收款扫描"]],
    ["app/sales/page.js", ["销售开单", "打印销售单"]],
    ["app/search/page.js", ["全局搜索", "搜索词", "销售单"]]
  ];

  for (const [relativePath, phrases] of pages) {
    const source = read(relativePath);

    for (const phrase of phrases) {
      assert.match(source, new RegExp(phrase), `${relativePath} should include ${phrase}`);
    }
  }
});

test("sales and purchase pages do not expose mojibake Chinese copy", () => {
  const frontendSource = [
    "app/sales/page.js",
    "app/sales/SalesFormClient.js",
    "app/purchases/page.js",
    "app/purchases/PurchaseFormClient.js"
  ]
    .map(read)
    .join("\n");

  const forbiddenFragments = [
    "杩斿洖",
    "棣栭〉",
    "閲囪喘",
    "鍒犻櫎",
    "宸蹭繚瀛",
    "搴撳瓨",
    "璇锋",
    "淇濆瓨",
    "寮€",
    "鏌滃彴",
    "瀹㈡埛",
    "娣诲姞",
    "鏈",
    "澶囨敞",
    "閿€",
    "灏忚",
    "浼樻",
    "鍚堣",
    "鐘舶",
    "鐘舵",
    "鍟嗗搧",
    "鏁伴噺",
    "琛屽悎",
    "鍐欏叆",
    "寰呮敹",
    "攢鍞",
    "鏉℃",
    "祦姘",
    "銆",
    "锛",
    "�"
  ];

  for (const fragment of forbiddenFragments) {
    assert.doesNotMatch(frontendSource, new RegExp(escapeRegExp(fragment)));
  }
});

test("frontend source no longer exposes common English UI phrases", () => {
  const frontendSource = [
    "app/dashboard/page.js",
    "app/products/page.js",
    "app/customers/page.js",
    "app/customers/CustomerListClient.js",
    "app/sales/page.js",
    "app/sales/SalesFormClient.js",
    "app/purchases/page.js",
    "app/purchases/PurchaseFormClient.js",
    "app/inventory/page.js",
    "app/inventory/adjustments/page.js",
    "app/inventory/adjustments/InventoryAdjustmentClient.js",
    "app/inventory/low-stock/page.js",
    "app/login/page.js",
    "app/reports/daily/page.js",
    "app/search/page.js",
    "app/products/editor/page.js",
    "app/products/editor/ProductEditorClient.js",
    "app/sales/print/page.js"
  ]
    .map(read)
    .join("\n");

  const forbiddenPhrases = [
    "Back to dashboard",
    "Back home",
    "Today dashboard",
    "Local Day",
    "Sales bill",
    "Purchase receiving",
    "Inventory ledger",
    "Low-stock alerts",
    "Search term",
    "Add locally",
    "Save locally",
    "No local sales orders saved yet.",
    "No stock has been deducted yet.",
    "Print bill",
    "Store login",
    "Sign in",
    "Print sales bill",
    "Customer copy",
    "Talk track",
    "Receipt proof",
    "No-go items"
  ];

  for (const phrase of forbiddenPhrases) {
    assert.doesNotMatch(frontendSource, new RegExp(escapeRegExp(phrase)));
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\¥&");
}
