import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("product routes no longer expose demo pages or demo navigation", () => {
  assert.equal(existsSync(join(root, "app", "demo", "page.js")), false);
  assert.equal(existsSync(join(root, "app", "demo", "script", "page.js")), false);

  const uxCopy = read("src/ux-copy.js");

  assert.doesNotMatch(uxCopy, /href: "\/demo/);
  assert.doesNotMatch(uxCopy, /demoCopy|demoScriptCopy|演示|demo/i);
});

test("test fixture sample data uses productized names and Chinese visible fields", async () => {
  assert.equal(existsSync(join(root, "src", "sample-data.js")), false);
  assert.equal(existsSync(join(root, "test", "fixtures", "sample-data.js")), true);
  assert.equal(existsSync(join(root, "src", "demo-data.js")), false);

  const sampleData = await import("./fixtures/sample-data.js");

  assert.ok(sampleData.sampleProducts.length >= 20);
  assert.ok(sampleData.sampleCustomers.length >= 5);
  assert.ok(sampleData.sampleSuppliers.length >= 3);
  assert.ok(sampleData.sampleSavedOrders.length >= 3);
  assert.ok(sampleData.sampleSavedPurchases.length >= 2);
  assert.ok(sampleData.sampleInventoryMovements.length >= 5);

  const visibleStrings = [
    ...sampleData.sampleProducts.flatMap((item) => [item.name, item.spec, item.unit]),
    ...sampleData.sampleCustomers.flatMap((item) => [item.name, item.notes]),
    ...sampleData.sampleSuppliers.flatMap((item) => [item.name, item.notes]),
    ...sampleData.sampleSavedOrders.flatMap((savedOrder) => [
      savedOrder.order.customerNameSnapshot,
      savedOrder.order.notes,
      ...savedOrder.items.flatMap((item) => [item.productNameSnapshot, item.specSnapshot, item.unit])
    ]),
    ...sampleData.sampleSavedPurchases.flatMap((savedPurchase) => [
      savedPurchase.order.supplierNameSnapshot,
      savedPurchase.order.notes,
      ...savedPurchase.items.flatMap((item) => [item.productNameSnapshot, item.specSnapshot, item.unit])
    ]),
    ...sampleData.sampleInventoryMovements.flatMap((item) => [
      item.productNameSnapshot,
      item.specSnapshot,
      item.notes
    ])
  ].filter(Boolean);

  for (const value of visibleStrings) {
    assert.doesNotMatch(value, /[A-Za-z]/, `visible sample text should be Chinese: ${value}`);
  }
});

test("production app runtime does not import mock or local fallback data", () => {
  const runtimeFiles = [
    ...listJsFiles(join(root, "app")),
    join(root, "src", "development-page-reads.js"),
    join(root, "src", "products.js"),
    join(root, "src", "customers.js"),
    join(root, "src", "suppliers.js")
  ];
  const runtimeSource = runtimeFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n");

  assert.doesNotMatch(runtimeSource, /from ["'].*sample-data\.js["']/);
  assert.doesNotMatch(runtimeSource, /seedProducts|seedCustomers|seedSuppliers/);
  assert.doesNotMatch(runtimeSource, /sampleSavedOrders|sampleMovements|createDemoSavedOrder/);
  assert.doesNotMatch(runtimeSource, /local_fallback/);
  assert.doesNotMatch(runtimeSource, /本地样例|本地演示|样例数据只保存在本地|当前只检索样例记录/);
});

test("money formatting uses RMB instead of USD", async () => {
  const { formatMoney } = await import("../src/daily-report.js");
  const source = [
    read("src/daily-report.js"),
    read("app/dashboard/page.js"),
    read("app/products/page.js"),
    read("app/customers/CustomerListClient.js"),
    read("app/sales/SalesFormClient.js"),
    read("app/purchases/PurchaseFormClient.js"),
    read("app/products/editor/ProductEditorClient.js"),
    read("app/reports/daily/page.js"),
    read("app/sales/print/page.js")
  ].join("\n");

  assert.equal(formatMoney(73), "¥73.00");
  assert.doesNotMatch(source, /currency:\s*"USD"/);
  assert.doesNotMatch(source, /return `¥/);
});

function listJsFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return listJsFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
  });
}
