import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  appendProduct,
  createProductDraft,
  normalizeProductDraft,
  updateProductAt,
  validateProductDraft
} from "../src/product-editor.js";
import { seedProducts } from "./fixtures/catalog.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Day 007 creates an editable draft from an existing product", () => {
  const draft = createProductDraft(seedProducts[0]);

  assert.deepEqual(draft, {
    name: "内墙乳胶漆",
    spec: "白色 1 加仑",
    unit: "罐",
    costPrice: "18",
    salePrice: "29",
    currentStock: "24",
    lowStockThreshold: "6"
  });
});

test("Day 007 validates required product fields and numeric values", () => {
  assert.deepEqual(
    validateProductDraft({
      name: "",
      spec: "",
      unit: "",
      costPrice: "-1",
      salePrice: "0",
      currentStock: "-2",
      lowStockThreshold: "-1"
    }),
    {
      name: "商品名称不能为空。",
      spec: "规格不能为空。",
      unit: "单位不能为空。",
      costPrice: "成本价不能小于 0。",
      salePrice: "销售价必须大于 0。",
      currentStock: "当前库存不能小于 0。",
      lowStockThreshold: "低库存阈值不能小于 0。"
    }
  );
});

test("Day 007 normalizes a valid draft into the product shape", () => {
  const product = normalizeProductDraft({
    name: "  Enamel Paint  ",
    spec: " Blue 1 gal ",
    unit: " can ",
    costPrice: "20.50",
    salePrice: "34.75",
    currentStock: "12",
    lowStockThreshold: "4"
  });

  assert.deepEqual(product, {
    name: "Enamel Paint",
    spec: "Blue 1 gal",
    unit: "can",
    costPrice: 20.5,
    salePrice: 34.75,
    currentStock: 12,
    lowStockThreshold: 4
  });
});

test("Day 007 can append and update products without mutating the original list", () => {
  const original = seedProducts.slice(0, 2);
  const newProduct = normalizeProductDraft({
    name: "Ceiling Paint",
    spec: "Flat 1 gal",
    unit: "罐",
    costPrice: "16",
    salePrice: "27",
    currentStock: "9",
    lowStockThreshold: "3"
  });

  const appended = appendProduct(original, newProduct);
  const updated = updateProductAt(appended, 0, {
    ...appended[0],
    salePrice: 31,
    currentStock: 20
  });

  assert.equal(original.length, 2);
  assert.equal(appended.length, 3);
  assert.equal(appended[2].name, "Ceiling Paint");
  assert.equal(updated[0].salePrice, 31);
  assert.equal(updated[0].currentStock, 20);
  assert.equal(appended[0].salePrice, seedProducts[0].salePrice);
});

test("empty Supabase product catalog is ready for the first product write", async () => {
  const { isWritableCatalogReadSource } = await import("../src/catalog-readiness.js");

  assert.equal(isWritableCatalogReadSource("supabase"), true);
  assert.equal(isWritableCatalogReadSource("supabase_empty"), true);
  assert.equal(isWritableCatalogReadSource("loading"), false);
  assert.equal(isWritableCatalogReadSource("supabase_error"), false);
  assert.equal(isWritableCatalogReadSource("supabase_unavailable"), false);
});

test("Day 007 creates a product editor route without direct browser Supabase writes", () => {
  const pagePath = join(root, "app", "products", "editor", "page.js");
  const clientPath = join(root, "app", "products", "editor", "ProductEditorClient.js");

  assert.ok(existsSync(pagePath), "app/products/editor/page.js is missing");
  assert.ok(existsSync(clientPath), "ProductEditorClient.js is missing");

  const page = readFileSync(pagePath, "utf8");
  const client = readFileSync(clientPath, "utf8");

  assert.match(page, /ProductEditorClient/);
  assert.match(page, /useDatabasePageData/);
  assert.match(page, /onSaved/);
  assert.match(client, /useState/);
  assert.match(client, /\/api\/catalog\/products/);
  assert.match(client, /isWritableCatalogReadSource/);
  assert.doesNotMatch(client, /readSource !== "supabase"/);
  assert.doesNotMatch(client, /appendProduct|updateProductAt/);
  assert.doesNotMatch(client, /\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});

test("product list links to the local editor route", () => {
  const page = readFileSync(join(root, "app", "products", "page.js"), "utf8");

  assert.match(page, /href="\/products\/editor"/);
});
