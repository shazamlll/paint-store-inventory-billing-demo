import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const migrationPath = join(root, "supabase", "migrations", "0007_runtime_read_privileges_and_purchase_repair.sql");

const runtimeReadTables = [
  "stores",
  "store_members",
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

test("runtime database repair grants every runtime-read table to authenticated users", () => {
  assert.ok(existsSync(migrationPath), "runtime database repair migration is missing");

  const sql = readFileSync(migrationPath, "utf8").toLowerCase();

  assert.match(sql, /grant usage on schema public to authenticated/);

  for (const table of runtimeReadTables) {
    assert.match(sql, new RegExp(`grant select on public\\.${table} to authenticated`));
  }
});

test("runtime database repair backfills payment columns and purchase transaction rpc", () => {
  assert.ok(existsSync(migrationPath), "runtime database repair migration is missing");

  const sql = readFileSync(migrationPath, "utf8").toLowerCase();

  assert.match(sql, /alter table public\.sales_orders\s+add column if not exists payment_amount/);
  assert.match(sql, /alter table public\.purchase_orders\s+add column if not exists payment_amount/);
  assert.match(sql, /create or replace function public\.save_purchase_order_transaction\(p_payload jsonb\)/);
  assert.match(sql, /grant execute on function public\.save_purchase_order_transaction\(jsonb\) to authenticated/);
  assert.match(sql, /notify\s+pgrst,\s*'reload schema'/);
});
