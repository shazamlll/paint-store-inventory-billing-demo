import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function loadCorrectionPolicy() {
  const modulePath = join(root, "src", "correction-policy.js");

  assert.equal(existsSync(modulePath), true, "src/correction-policy.js is missing");

  return import("../src/correction-policy.js");
}

test("Day 043 records payment chain deferral and audit-first sprint scope", () => {
  const roadmap = readFileSync(join(root, "docs", "sprints", "day037_to_day046_production_roadmap.md"), "utf8");
  const readme = readFileSync(join(root, "docs/development-history.md"), "utf8");

  assert.match(roadmap, /Day 043: Audit Logs, Correction Rules, and Receivable Foundation/);
  assert.match(roadmap, /Standalone customer payment entry is deferred/);
  assert.match(roadmap, /Sales receivables remain queryable from persisted orders and customer balances/);
  assert.match(readme, /Day 043 is adjusted to audit logs, correction rules, and receivable foundation/);
  assert.match(readme, /standalone customer payment workflow is intentionally deferred/);
});

test("Day 043 correction policy blocks destructive deletes and defers standalone payments", async () => {
  const {
    getCorrectionPolicy,
    listProtectedBusinessTables
  } = await loadCorrectionPolicy();

  assert.deepEqual(listProtectedBusinessTables(), [
    "sales_orders",
    "sales_order_items",
    "purchase_orders",
    "purchase_order_items",
    "payments",
    "inventory_movements"
  ]);

  assert.deepEqual(
    getCorrectionPolicy("sales_order", { paymentAmount: 0 }),
    {
      target: "sales_order",
      canDelete: false,
      canReverseNow: true,
      reason: "sales_order_reversal_supported_when_no_payment_is_attached",
      requiredAction: "reverse_sales_order_transaction"
    }
  );

  assert.deepEqual(
    getCorrectionPolicy("sales_order", { paymentAmount: 25 }),
    {
      target: "sales_order",
      canDelete: false,
      canReverseNow: false,
      reason: "sales_order_payment_reversal_deferred",
      requiredAction: "wait_for_standalone_payment_reversal_sprint"
    }
  );

  assert.deepEqual(
    getCorrectionPolicy("customer_payment"),
    {
      target: "customer_payment",
      canDelete: false,
      canReverseNow: false,
      reason: "standalone_customer_payment_chain_deferred",
      requiredAction: "implement_payment_reversal_with_payment_workflow"
    }
  );
});

test("Day 043 migration adds audit logs, removes destructive delete policies, and exposes sales reversal RPC", () => {
  const migrationPath = join(root, "supabase", "migrations", "0005_audit_correction_foundation.sql");

  assert.ok(existsSync(migrationPath), "Day 043 migration is missing");

  const migration = readFileSync(migrationPath, "utf8");

  assert.match(migration, /create table if not exists public\.audit_logs/);
  assert.match(migration, /actor_user_id uuid/);
  assert.match(migration, /operation text not null/);
  assert.match(migration, /target_table text not null/);
  assert.match(migration, /target_id uuid/);
  assert.match(migration, /created_at timestamptz not null default now\(\)/);
  assert.match(migration, /alter table public\.audit_logs enable row level security/);
  assert.match(migration, /create policy audit_logs_store_select/);
  assert.match(migration, /create or replace function public\.audit_business_row_change/);
  assert.match(migration, /create trigger audit_sales_orders_changes/);
  assert.match(migration, /create trigger audit_purchase_orders_changes/);
  assert.match(migration, /create trigger audit_payments_changes/);
  assert.match(migration, /drop policy if exists sales_orders_store_delete/);
  assert.match(migration, /drop policy if exists payments_store_delete/);
  assert.match(migration, /add column if not exists correction_status/);
  assert.match(migration, /create or replace function public\.reverse_sales_order_transaction/);
  assert.match(migration, /sales order with attached payment requires payment reversal workflow/);
  assert.match(migration, /grant execute on function public\.reverse_sales_order_transaction/);
});

test("Day 043 documentation records audit and correction boundary", () => {
  const sprintDocPath = join(root, "docs", "sprints", "day043_audit_correction_receivable_foundation.md");

  assert.ok(existsSync(sprintDocPath), "Day 043 sprint doc is missing");

  const sprintDoc = readFileSync(sprintDocPath, "utf8");

  assert.match(sprintDoc, /Day 043 Audit Logs, Correction Rules, and Receivable Foundation/);
  assert.match(sprintDoc, /Standalone customer payment entry is deferred/);
  assert.match(sprintDoc, /Destructive deletes are removed from key transactional tables/);
  assert.match(sprintDoc, /reverse_sales_order_transaction/);
  assert.match(sprintDoc, /Payment reversal remains a future sprint dependency/);
});
