export const developmentSupabaseMigrations = [
  {
    id: "0001_initial_schema",
    path: "supabase/migrations/0001_initial_schema.sql",
    purpose: "create MVP catalog, document, payment, and inventory tables"
  },
  {
    id: "0002_multi_tenant_rls",
    path: "supabase/migrations/0002_multi_tenant_rls.sql",
    purpose: "add store isolation, store_id columns, and RLS policies"
  }
];

export function normalizeSupabaseProjectUrl(value) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  return raw.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/g, "");
}

export function buildDevelopmentSupabasePlan({ projectUrl, publishableKey }) {
  return {
    mode: "development_only",
    projectUrl: normalizeSupabaseProjectUrl(projectUrl),
    hasPublishableKey: String(publishableKey ?? "").startsWith("sb_publishable_"),
    canRunSqlWithPublishableKey: false,
    sqlEditorFile: "docs/supabase/day034_development_migration.sql",
    migrations: developmentSupabaseMigrations,
    dryRunInputs: [
      "docs/pilot/templates/products.csv",
      "docs/pilot/templates/customers.csv",
      "docs/pilot/templates/suppliers.csv",
      "docs/pilot/templates/opening_stock.csv",
      "docs/pilot/templates/opening_receivables.csv"
    ],
    requiredManualStep:
      "Run docs/supabase/day034_development_migration.sql in the Supabase SQL Editor for the development project.",
    blockedOperations: ["production_data_import", "live_sales_order_write", "service_role_key_in_browser"]
  };
}
