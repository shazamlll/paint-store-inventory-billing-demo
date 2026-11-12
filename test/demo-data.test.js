import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  sampleCustomers,
  sampleInventoryMovements,
  sampleProducts,
  sampleSavedOrders,
  sampleSavedPurchases,
  sampleSuppliers,
  getSampleDataSummary
} from "./fixtures/sample-data.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const sampleReportDate = "2026-06-23";

test("Day 025 expands local sample catalog breadth", () => {
  const categories = new Set(sampleProducts.map((product) => product.category));
  const customerTypes = new Set(sampleCustomers.map((customer) => customer.customerType));

  assert.ok(sampleProducts.length >= 30);
  assert.ok(categories.has("paint"));
  assert.ok(categories.has("primer"));
  assert.ok(categories.has("stain"));
  assert.ok(categories.has("sundry"));
  assert.ok(categories.has("prep"));
  assert.ok(categories.has("tool"));
  assert.ok(sampleCustomers.length >= 8);
  assert.ok(customerTypes.has("walk-in"));
  assert.ok(customerTypes.has("homeowner"));
  assert.ok(customerTypes.has("contractor"));
  assert.ok(customerTypes.has("property-manager"));
  assert.ok(customerTypes.has("workshop"));
  assert.ok(sampleSuppliers.length >= 4);
});

test("Day 025 covers realistic sales, purchase, and stock states", () => {
  const salesPaymentStates = new Set(sampleSavedOrders.map((savedOrder) => savedOrder.order.paymentStatus));
  const purchasePaymentStates = new Set(
    sampleSavedPurchases.map((savedPurchase) => savedPurchase.order.paymentStatus)
  );
  const currentDateOrderCount = sampleSavedOrders.filter(
    (savedOrder) => savedOrder.order.orderDate === sampleReportDate
  ).length;
  const earlierOrderCount = sampleSavedOrders.filter(
    (savedOrder) => savedOrder.order.orderDate < sampleReportDate
  ).length;
  const lowStockCount = sampleProducts.filter(
    (product) => product.currentStock <= product.lowStockThreshold
  ).length;

  assert.deepEqual([...salesPaymentStates].sort(), ["paid", "partial", "unpaid"]);
  assert.ok(purchasePaymentStates.has("paid"));
  assert.ok(purchasePaymentStates.has("unpaid"));
  assert.ok(currentDateOrderCount >= 2);
  assert.ok(earlierOrderCount >= 1);
  assert.ok(lowStockCount >= 2);
});

test("Day 025 sample records reference valid local catalogs", () => {
  const productKeys = new Set(sampleProducts.map(productKey));
  const customerNames = new Set(sampleCustomers.map((customer) => customer.name));
  const supplierNames = new Set(sampleSuppliers.map((supplier) => supplier.name));

  for (const savedOrder of sampleSavedOrders) {
    assert.ok(customerNames.has(savedOrder.order.customerNameSnapshot));

    for (const item of savedOrder.items) {
      assert.ok(productKeys.has(productKey(item)), `Missing sales product ${productKey(item)}`);
      assert.equal(item.salesOrderNumber, savedOrder.order.orderNumber);
    }
  }

  for (const savedPurchase of sampleSavedPurchases) {
    assert.ok(supplierNames.has(savedPurchase.order.supplierNameSnapshot));

    for (const item of savedPurchase.items) {
      assert.ok(productKeys.has(productKey(item)), `Missing purchase product ${productKey(item)}`);
      assert.equal(item.purchaseOrderNumber, savedPurchase.order.orderNumber);
    }
  }
});

test("Day 025 sample document totals match their line items", () => {
  for (const savedOrder of sampleSavedOrders) {
    const subtotal = roundMoney(
      savedOrder.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
    );
    const discountAmount = roundMoney(
      savedOrder.items.reduce((total, item) => total + item.discountAmount, 0)
    );
    const totalAmount = roundMoney(
      savedOrder.items.reduce((total, item) => total + item.lineTotal, 0)
    );

    assert.equal(savedOrder.order.subtotal, subtotal);
    assert.equal(savedOrder.order.discountAmount, discountAmount);
    assert.equal(savedOrder.order.totalAmount, totalAmount);
    assert.equal(savedOrder.order.receivableDelta, roundMoney(totalAmount - savedOrder.order.paymentAmount));
  }

  for (const savedPurchase of sampleSavedPurchases) {
    const totalAmount = roundMoney(
      savedPurchase.items.reduce((total, item) => total + item.lineTotal, 0)
    );

    assert.equal(savedPurchase.order.subtotal, totalAmount);
    assert.equal(savedPurchase.order.totalAmount, totalAmount);
    assert.equal(savedPurchase.order.payableDelta, roundMoney(totalAmount - savedPurchase.order.paymentAmount));
  }
});

test("Day 025 inventory movements cover supported source types and valid products", () => {
  const productKeys = new Set(sampleProducts.map(productKey));
  const supportedSources = new Set(["sale", "purchase", "manual-adjustment"]);
  const movementSources = new Set(sampleInventoryMovements.map((movement) => movement.sourceType));

  assert.ok(movementSources.has("sale"));
  assert.ok(movementSources.has("purchase"));
  assert.ok(movementSources.has("manual-adjustment"));

  for (const movement of sampleInventoryMovements) {
    assert.ok(productKeys.has(productKey(movement)), `Missing movement product ${productKey(movement)}`);
    assert.ok(supportedSources.has(movement.sourceType));
    assert.equal(typeof movement.quantityDelta, "number");
    assert.equal(typeof movement.stockAfter, "number");
  }
});

test("Day 025 summarizes sample data for operational scanning", () => {
  assert.deepEqual(getSampleDataSummary(), {
    productCount: sampleProducts.length,
    customerCount: sampleCustomers.length,
    supplierCount: sampleSuppliers.length,
    salesOrderCount: sampleSavedOrders.length,
    purchaseOrderCount: sampleSavedPurchases.length,
    inventoryMovementCount: sampleInventoryMovements.length,
    lowStockCount: sampleProducts.filter((product) => product.currentStock <= product.lowStockThreshold).length,
    receivableOrderCount: sampleSavedOrders.filter((savedOrder) => savedOrder.order.receivableDelta > 0).length
  });
});

test("Day 025 sample data remains documented but is not promoted on the home page", () => {
  const sprintPath = join(root, "docs", "sprints", "day025_demo_seed_data.md");
  const homePage = readFileSync(join(root, "app", "page.js"), "utf8");

  assert.ok(existsSync(sprintPath), "Day 025 sprint doc is missing");
  assert.match(readFileSync(sprintPath, "utf8"), /local demo data/i);
  assert.equal(homeCopy.sampleDataSection, undefined);
  assert.doesNotMatch(homePage, /getSampleDataSummary|样例数据|本地经营样例/);
});

function productKey(product) {
  return `${product.productNameSnapshot ?? product.name}\u0000${product.specSnapshot ?? product.spec}`;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
