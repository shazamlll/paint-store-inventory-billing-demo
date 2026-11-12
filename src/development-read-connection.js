import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseProjectUrl } from "./development-supabase.js";
import { readEnvValue } from "./env.js";

export const developmentReadTables = [
  tableRead("stores", ["id", "name", "phone", "address", "notes"]),
  tableRead("products", ["id", "store_id", "name", "spec", "unit", "sale_price", "current_stock", "low_stock_threshold"]),
  tableRead("customers", ["id", "store_id", "name", "phone", "notes", "receivable_balance"]),
  tableRead("suppliers", ["id", "store_id", "name", "phone", "notes", "payable_balance"]),
  tableRead("sales_orders", ["id", "store_id", "order_number", "customer_id", "order_date", "total_amount", "payment_amount", "payment_status", "receivable_delta"]),
  tableRead("sales_order_items", ["id", "store_id", "sales_order_id", "product_id", "product_name_snapshot", "quantity", "line_total"]),
  tableRead("purchase_orders", ["id", "store_id", "order_number", "supplier_id", "received_date", "total_amount", "payment_amount", "payment_status", "payable_delta"]),
  tableRead("purchase_order_items", ["id", "store_id", "purchase_order_id", "product_id", "product_name_snapshot", "quantity", "line_total"]),
  tableRead("inventory_movements", ["id", "store_id", "product_id", "movement_type", "quantity_delta", "stock_after", "source_table", "source_id"])
];

export function getDevelopmentReadEnvironment(env = process.env) {
  const projectUrl = normalizeSupabaseProjectUrl(readEnvValue(env, "NEXT_PUBLIC_SUPABASE_URL"));
  const anonKey = readEnvValue(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const missing = [];

  if (!projectUrl) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    ready: missing.length === 0,
    projectUrl,
    hasAnonKey: anonKey.length > 0,
    anonKeyPreview: previewAnonKey(anonKey),
    missing
  };
}

export function buildDevelopmentReadPlan({ env = process.env, migrationVerified = false, rlsVerified = false } = {}) {
  const readEnv = getDevelopmentReadEnvironment(env);
  const blockers = [];

  if (!readEnv.ready) {
    blockers.push("supabase_env_missing");
  }

  if (!migrationVerified) {
    blockers.push("migration_not_verified");
  }

  if (!rlsVerified) {
    blockers.push("rls_not_verified");
  }

  return {
    mode: "development_read_only",
    readyToRead: blockers.length === 0,
    environment: readEnv,
    blockers,
    allowedReads: developmentReadTables,
    blockedOperations: ["insert", "update", "delete", "upsert", "rpc", "production_write", "live_sales_order_write"]
  };
}

export function createDevelopmentReadClient(env = process.env, clientFactory = createClient) {
  const projectUrl = normalizeSupabaseProjectUrl(readEnvValue(env, "NEXT_PUBLIC_SUPABASE_URL"));
  const anonKey = readEnvValue(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!projectUrl || !anonKey) {
    throw new Error("Missing development Supabase read environment");
  }

  return clientFactory(projectUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function tableRead(table, columns) {
  return {
    table,
    operation: "select",
    columns,
    requiresStoreScopedRls: true
  };
}

function previewAnonKey(value) {
  if (!value) {
    return "";
  }

  if (value.startsWith("sb_publishable_")) {
    return "sb_publishable_...";
  }

  return `${value.slice(0, 6)}...`;
}
