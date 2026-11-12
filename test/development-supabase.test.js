import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

async function loadDevelopmentSupabase() {
  const modulePath = join(root, "src", "development-supabase.js");

  assert.equal(existsSync(modulePath), true, "src/development-supabase.js is missing");

  return import("../src/development-supabase.js");
}

test("Day 034 normalizes Supabase API URLs to the project root URL", async () => {
  const { normalizeSupabaseProjectUrl } = await loadDevelopmentSupabase();

  assert.equal(
    normalizeSupabaseProjectUrl("https://demo-project.supabase.co/rest/v1/"),
    "https://demo-project.supabase.co"
  );
});

test("Day 034 builds a development Supabase migration plan without production writes", async () => {
  const { buildDevelopmentSupabasePlan } = await loadDevelopmentSupabase();
  const plan = buildDevelopmentSupabasePlan({
    projectUrl: "https://demo-project.supabase.co/rest/v1/",
    publishableKey: "sb_publishable_example"
  });

  assert.equal(plan.mode, "development_only");
  assert.equal(plan.projectUrl, "https://demo-project.supabase.co");
  assert.equal(plan.canRunSqlWithPublishableKey, false);
  assert.deepEqual(
    plan.migrations.map((migration) => migration.path),
    ["supabase/migrations/0001_initial_schema.sql", "supabase/migrations/0002_multi_tenant_rls.sql"]
  );
  assert.ok(plan.blockedOperations.includes("production_data_import"));
});

test("Day 034 combined SQL file contains both migrations in order", () => {
  const combinedPath = join(root, "docs", "supabase", "day034_development_migration.sql");

  assert.equal(existsSync(combinedPath), true, "Day 034 combined SQL file is missing");

  const sql = read("docs/supabase/day034_development_migration.sql").toLowerCase();
  const initialIndex = sql.indexOf("create table if not exists public.products");
  const rlsIndex = sql.indexOf("create table if not exists public.stores");

  assert.ok(initialIndex >= 0, "initial schema SQL is missing");
  assert.ok(rlsIndex > initialIndex, "RLS migration must run after initial schema");
  assert.match(sql, /enable row level security/);
});

test("Day 034 documentation records the SQL Editor path and development boundary", () => {
  const docPath = join(root, "docs", "sprints", "day034_development_supabase_dry_run.md");

  assert.equal(existsSync(docPath), true, "Day 034 sprint doc is missing");

  const doc = read("docs/sprints/day034_development_supabase_dry_run.md");

  assert.match(doc, /Day 034 Development Supabase Dry Run/);
  assert.match(doc, /SQL Editor/);
  assert.match(doc, /development Supabase project only/);
  assert.match(doc, /publishable key cannot run SQL migrations/);
});
