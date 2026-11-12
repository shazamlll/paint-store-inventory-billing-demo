import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

async function loadDevelopmentReadConnection() {
  const modulePath = join(root, "src", "development-read-connection.js");

  assert.equal(existsSync(modulePath), true, "src/development-read-connection.js is missing");

  return import("../src/development-read-connection.js");
}

test("Day 035 validates development Supabase read environment without exposing secrets", async () => {
  const { getDevelopmentReadEnvironment } = await loadDevelopmentReadConnection();
  const result = getDevelopmentReadEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/rest/v1/",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_example"
  });

  assert.equal(result.ready, true);
  assert.equal(result.projectUrl, "https://example.supabase.co");
  assert.equal(result.hasAnonKey, true);
  assert.equal(result.anonKeyPreview, "sb_publishable_...");
  assert.equal(result.anonKey, undefined);
});

test("Supabase environment lookup tolerates deployment variable casing differences", async () => {
  const { getDevelopmentReadEnvironment } = await loadDevelopmentReadConnection();
  const result = getDevelopmentReadEnvironment({
    next_public_supabase_url: "https://example.supabase.co/rest/v1/",
    next_public_supabase_anon_key: "sb_publishable_example"
  });

  assert.equal(result.ready, true);
  assert.equal(result.projectUrl, "https://example.supabase.co");
  assert.equal(result.hasAnonKey, true);
  assert.deepEqual(result.missing, []);
});

test("Supabase environment lookup falls back when canonical variables are blank", async () => {
  const { getDevelopmentReadEnvironment } = await loadDevelopmentReadConnection();
  const result = getDevelopmentReadEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: " ",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    next_public_supabase_url: "https://example.supabase.co/rest/v1/",
    next_public_supabase_anon_key: "sb_publishable_example"
  });

  assert.equal(result.ready, true);
  assert.equal(result.projectUrl, "https://example.supabase.co");
  assert.equal(result.hasAnonKey, true);
  assert.deepEqual(result.missing, []);
});

test("Day 035 keeps development reads blocked until migration and RLS are verified", async () => {
  const { buildDevelopmentReadPlan } = await loadDevelopmentReadConnection();
  const plan = buildDevelopmentReadPlan({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_example"
    },
    migrationVerified: false,
    rlsVerified: false
  });

  assert.equal(plan.mode, "development_read_only");
  assert.equal(plan.readyToRead, false);
  assert.ok(plan.blockers.includes("migration_not_verified"));
  assert.ok(plan.blockers.includes("rls_not_verified"));
  assert.ok(plan.blockedOperations.includes("insert"));
  assert.ok(plan.blockedOperations.includes("update"));
  assert.ok(plan.blockedOperations.includes("delete"));
});

test("Day 035 defines an allowlisted read plan for page database tables", async () => {
  const { buildDevelopmentReadPlan } = await loadDevelopmentReadConnection();
  const plan = buildDevelopmentReadPlan({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_example"
    },
    migrationVerified: true,
    rlsVerified: true
  });

  assert.equal(plan.readyToRead, true);
  assert.deepEqual(
    plan.allowedReads.map((readPlan) => readPlan.table),
    [
      "stores",
      "products",
      "customers",
      "suppliers",
      "sales_orders",
      "sales_order_items",
      "purchase_orders",
      "purchase_order_items",
      "inventory_movements"
    ]
  );
  assert.ok(plan.allowedReads.every((readPlan) => readPlan.operation === "select"));
  assert.ok(plan.allowedReads.every((readPlan) => readPlan.requiresStoreScopedRls === true));
});

test("Day 035 creates a Supabase client only through injected or public config", async () => {
  const { createDevelopmentReadClient } = await loadDevelopmentReadConnection();
  const calls = [];
  const client = createDevelopmentReadClient(
    {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_example"
    },
    (url, key, options) => {
      calls.push({ url, key, options });
      return { from: () => ({ select: () => ({ limit: () => [] }) }) };
    }
  );

  assert.equal(calls[0].url, "https://example.supabase.co");
  assert.equal(calls[0].key, "sb_publishable_example");
  assert.equal(calls[0].options.auth.persistSession, false);
  assert.equal(typeof client.from, "function");
});

test("Day 035 source and docs keep writes out of the read connection", () => {
  const sourcePath = join(root, "src", "development-read-connection.js");
  const docPath = join(root, "docs", "sprints", "day035_development_supabase_reads.md");

  assert.equal(existsSync(sourcePath), true, "Day 035 source is missing");
  assert.equal(existsSync(docPath), true, "Day 035 sprint doc is missing");

  const source = read("src/development-read-connection.js");
  const doc = read("docs/sprints/day035_development_supabase_reads.md");

  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
  assert.match(doc, /Day 035 Development Supabase Reads/);
  assert.match(doc, /只读/);
  assert.match(doc, /不接真实业务写入/);
  assert.match(doc, /RLS verified/);
});
