import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { getTableNames } from "../src/schema.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const migrationPath = join(root, "supabase", "migrations", "0001_initial_schema.sql");
const seedPath = join(root, "supabase", "seed.sql");
const strategyPath = join(root, "docs", "product", "seed_strategy.md");

function read(path) {
  return readFileSync(path, "utf8");
}

test("Day 005 creates local Supabase schema and seed artifacts", () => {
  assert.ok(existsSync(migrationPath), "initial schema migration is missing");
  assert.ok(existsSync(seedPath), "seed SQL is missing");
  assert.ok(existsSync(strategyPath), "seed strategy document is missing");
});

test("initial migration creates every Day 003 MVP table", () => {
  const sql = read(migrationPath).toLowerCase();

  for (const table of getTableNames()) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}\\b`));
  }
});

test("initial migration includes key foreign keys for document workflows", () => {
  const sql = read(migrationPath).toLowerCase();

  for (const fragment of [
    "customer_id uuid references public.customers(id)",
    "supplier_id uuid references public.suppliers(id)",
    "sales_order_id uuid references public.sales_orders(id)",
    "purchase_order_id uuid references public.purchase_orders(id)",
    "product_id uuid references public.products(id)"
  ]) {
    assert.match(sql, new RegExp(fragment.replace(/[()]/g, "\\$&")));
  }
});

test("initial migration constrains payment and inventory workflow states", () => {
  const sql = read(migrationPath).toLowerCase();

  assert.match(sql, /payment_status text not null default 'unpaid'/);
  assert.match(sql, /check \(payment_status in \('paid', 'partial', 'unpaid'\)\)/);
  assert.match(sql, /check \(movement_type in \('sale', 'purchase', 'adjustment'\)\)/);
  assert.match(sql, /check \(method in \('cash', 'bank_transfer', 'other'\)\)/);
});

test("seed SQL provides realistic Day 005 starter data", () => {
  const seed = read(seedPath);

  assert.equal((seed.match(/insert into public\.products/gi) ?? []).length, 20);
  assert.equal((seed.match(/insert into public\.customers/gi) ?? []).length, 5);
  assert.equal((seed.match(/insert into public\.suppliers/gi) ?? []).length, 3);
  assert.match(seed, /Interior Wall Paint/i);
  assert.match(seed, /Regular Contractor/i);
  assert.match(seed, /Regional Paint Supply/i);
});

test("seed strategy keeps Day 005 local and defers live Supabase work", () => {
  const doc = read(strategyPath).toLowerCase();

  assert.match(doc, /local/i);
  assert.match(doc, /day 006/i);
  assert.match(doc, /no live supabase/i);
});
