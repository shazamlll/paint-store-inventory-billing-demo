import test from "node:test";
import assert from "node:assert/strict";

import {
  day003Tables,
  findTable,
  flowToTableCoverage,
  getTableNames
} from "../src/schema.js";

test("Day 003 schema keeps the MVP to exactly nine tables", () => {
  assert.deepEqual(getTableNames(), [
    "products",
    "customers",
    "suppliers",
    "sales_orders",
    "sales_order_items",
    "purchase_orders",
    "purchase_order_items",
    "payments",
    "inventory_movements"
  ]);
  assert.equal(day003Tables.length, 9);
});

test("core catalog tables include lightweight shop-friendly fields", () => {
  assert.deepEqual(findTable("products").fields, [
    "id",
    "name",
    "spec",
    "unit",
    "cost_price",
    "sale_price",
    "current_stock",
    "low_stock_threshold",
    "active",
    "created_at",
    "updated_at"
  ]);
  assert.ok(findTable("customers").fields.includes("receivable_balance"));
  assert.ok(findTable("suppliers").fields.includes("payable_balance"));
});

test("sales order tables preserve billing, payment, and receivable state", () => {
  const order = findTable("sales_orders");
  const items = findTable("sales_order_items");

  assert.ok(order.fields.includes("customer_id"));
  assert.ok(order.fields.includes("payment_status"));
  assert.ok(order.fields.includes("receivable_delta"));
  assert.ok(order.fields.includes("total_amount"));
  assert.ok(items.fields.includes("product_id"));
  assert.ok(items.fields.includes("quantity"));
  assert.ok(items.fields.includes("line_total"));
});

test("purchase order tables preserve receiving and supplier payment state", () => {
  const order = findTable("purchase_orders");
  const items = findTable("purchase_order_items");

  assert.ok(order.fields.includes("supplier_id"));
  assert.ok(order.fields.includes("payment_status"));
  assert.ok(order.fields.includes("payable_delta"));
  assert.ok(items.fields.includes("unit_cost"));
  assert.ok(items.fields.includes("line_total"));
});

test("payments can link to sales orders without changing stock", () => {
  const payments = findTable("payments");

  assert.ok(payments.fields.includes("customer_id"));
  assert.ok(payments.fields.includes("sales_order_id"));
  assert.ok(payments.fields.includes("amount"));
  assert.equal(payments.affectsStock, false);
});

test("inventory movements are the audit trail for stock changes", () => {
  const movements = findTable("inventory_movements");

  assert.ok(movements.fields.includes("product_id"));
  assert.ok(movements.fields.includes("movement_type"));
  assert.ok(movements.fields.includes("quantity_delta"));
  assert.ok(movements.fields.includes("source_table"));
  assert.ok(movements.fields.includes("source_id"));
});

test("Day 002 flow data effects map to schema tables", () => {
  assert.deepEqual(flowToTableCoverage.sales_billing, [
    "sales_orders",
    "sales_order_items",
    "inventory_movements",
    "payments",
    "customers"
  ]);
  assert.deepEqual(flowToTableCoverage.purchase_receiving, [
    "purchase_orders",
    "purchase_order_items",
    "inventory_movements",
    "products",
    "suppliers"
  ]);
  assert.deepEqual(flowToTableCoverage.payment_tracking, [
    "payments",
    "sales_orders",
    "customers"
  ]);
});

test("findTable fails clearly for a table outside the MVP", () => {
  assert.throws(
    () => findTable("tax_invoices"),
    /Unknown table: tax_invoices/
  );
});
