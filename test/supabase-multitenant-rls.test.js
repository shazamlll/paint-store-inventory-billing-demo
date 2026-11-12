import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const migrationPath = join(root, "supabase", "migrations", "0002_multi_tenant_rls.sql");
const sprintPath = join(root, "docs", "sprints", "day032_supabase_multitenant_rls.md");

const tenantTables = [
  "products",
  "customers",
  "suppliers",
  "sales_orders",
  "sales_order_items",
  "purchase_orders",
  "purchase_order_items",
  "payments",
  "inventory_movements"
];

function read(path) {
  return readFileSync(path, "utf8");
}

test("Day 032 adds a multi-tenant Supabase migration", () => {
  assert.ok(existsSync(migrationPath), "Day 032 migration is missing");

  const sql = read(migrationPath).toLowerCase();

  assert.match(sql, /create table if not exists public\.stores\b/);
  assert.match(sql, /create table if not exists public\.store_members\b/);
  assert.match(sql, /user_id uuid not null references auth\.users\(id\)/);
  assert.match(sql, /role text not null default 'owner'/);
  assert.match(sql, /check \(role in \('owner', 'clerk', 'accountant'\)\)/);
});

test("Day 032 adds store_id to every business table", () => {
  const sql = read(migrationPath).toLowerCase();

  for (const table of tenantTables) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table}\\s+add column if not exists store_id uuid`)
    );
    assert.match(
      sql,
      new RegExp(`public\\.${table}.*references public\\.stores\\(id\\)`, "s")
    );
  }
});

test("Day 032 scopes order numbers by store instead of globally", () => {
  const sql = read(migrationPath).toLowerCase();

  assert.match(sql, /drop constraint if exists sales_orders_order_number_key/);
  assert.match(sql, /drop constraint if exists purchase_orders_order_number_key/);
  assert.match(sql, /create unique index if not exists idx_sales_orders_store_order_number/);
  assert.match(sql, /on public\.sales_orders\(store_id, order_number\)/);
  assert.match(sql, /create unique index if not exists idx_purchase_orders_store_order_number/);
  assert.match(sql, /on public\.purchase_orders\(store_id, order_number\)/);
});

test("Day 032 enables RLS and policies for store isolation", () => {
  const sql = read(migrationPath).toLowerCase();

  assert.match(sql, /create or replace function public\.current_user_store_ids\(\)/);

  for (const table of ["stores", "store_members", ...tenantTables]) {
    assert.match(sql, new RegExp(`alter table public\\.${table}\\s+enable row level security`));
    assert.match(sql, new RegExp(`create policy ${table}_store_select`));
  }

  for (const table of tenantTables) {
    assert.match(sql, new RegExp(`create policy ${table}_store_insert`));
    assert.match(sql, new RegExp(`create policy ${table}_store_update`));
    assert.match(sql, new RegExp(`create policy ${table}_store_delete`));
  }
});

test("Day 032 grants authenticated catalog reads for RLS policies", () => {
  const sql = read(migrationPath).toLowerCase();

  assert.match(sql, /grant usage on schema public to authenticated/);

  for (const table of ["products", "customers", "suppliers"]) {
    assert.match(sql, new RegExp(`grant select on public\\.${table} to authenticated`));
  }
});

test("Day 032 documentation keeps database work behind the intake gate", () => {
  assert.ok(existsSync(sprintPath), "Day 032 sprint doc is missing");

  const doc = read(sprintPath);

  assert.match(doc, /Day 032 Supabase Multi-Tenant RLS/);
  assert.match(doc, /Day 031/);
  assert.match(doc, /不接真实业务写入/);
  assert.match(doc, /RLS/);
  assert.match(doc, /store_id/);
});
