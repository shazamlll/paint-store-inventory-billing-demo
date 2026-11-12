import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function loadDevelopmentRlsEvidence() {
  const modulePath = join(root, "src", "development-rls-evidence.js");

  assert.equal(existsSync(modulePath), true, "src/development-rls-evidence.js is missing");

  return import("../src/development-rls-evidence.js");
}

test("Day 037 defines required RLS evidence checks for development catalog reads", async () => {
  const { requiredRlsEvidenceChecks } = await loadDevelopmentRlsEvidence();

  assert.deepEqual(
    requiredRlsEvidenceChecks.map((check) => check.id),
    [
      "development_migration_applied",
      "catalog_rls_enabled",
      "catalog_select_policies_present",
      "anon_key_does_not_bypass_rls",
      "store_member_reads_own_store",
      "store_member_cannot_read_other_store"
    ]
  );
  assert.ok(requiredRlsEvidenceChecks.every((check) => check.required === true));
  assert.ok(requiredRlsEvidenceChecks.every((check) => check.recordsSecret === false));
});

test("Day 037 evidence plan stays blocked until migration and RLS checks are recorded", async () => {
  const { buildDevelopmentRlsEvidencePlan } = await loadDevelopmentRlsEvidence();
  const plan = buildDevelopmentRlsEvidencePlan({
    projectRef: "demo-project",
    completedCheckIds: ["development_migration_applied", "catalog_rls_enabled"]
  });

  assert.equal(plan.mode, "development_rls_evidence");
  assert.equal(plan.readyForPilotReadReview, false);
  assert.equal(plan.projectRef, "demo-project");
  assert.ok(plan.remainingCheckIds.includes("anon_key_does_not_bypass_rls"));
  assert.ok(plan.blockedOperations.includes("production_write"));
  assert.ok(plan.blockedOperations.includes("live_sales_order_write"));
});

test("Day 037 evidence plan passes only when all required checks are recorded", async () => {
  const { buildDevelopmentRlsEvidencePlan, requiredRlsEvidenceChecks } = await loadDevelopmentRlsEvidence();
  const plan = buildDevelopmentRlsEvidencePlan({
    projectRef: "dev-project",
    completedCheckIds: requiredRlsEvidenceChecks.map((check) => check.id)
  });

  assert.equal(plan.readyForPilotReadReview, true);
  assert.deepEqual(plan.remainingCheckIds, []);
});

test("Day 037 read-only SQL evidence file avoids writes and secret exposure", () => {
  const sqlPath = join(root, "docs", "supabase", "day037_rls_evidence_checks.sql");

  assert.equal(existsSync(sqlPath), true, "Day 037 RLS evidence SQL file is missing");

  const sql = readFileSync(sqlPath, "utf8").toLowerCase();

  assert.match(sql, /pg_tables/);
  assert.match(sql, /pg_policies/);
  assert.match(sql, /row security/);
  assert.doesNotMatch(sql, /\binsert\b|\bupdate\b|\bdelete\b|\bupsert\b|\bdrop\b|\balter\b|\bcreate\b/);
  assert.doesNotMatch(sql, /service_role|secret|database_url|password/);
});

test("Day 037 sprint doc records evidence status without claiming live writes", () => {
  const docPath = join(root, "docs", "sprints", "day037_development_migration_rls_evidence.md");

  assert.equal(existsSync(docPath), true, "Day 037 sprint doc is missing");

  const doc = readFileSync(docPath, "utf8");

  assert.match(doc, /Day 037 Development Migration and RLS Evidence/);
  assert.match(doc, /not production-ready/i);
  assert.match(doc, /docs\/supabase\/day034_development_migration\.sql/);
  assert.match(doc, /docs\/supabase\/day037_rls_evidence_checks\.sql/);
  assert.match(doc, /anon key/i);
  assert.doesNotMatch(doc, /service_role|SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL/);
});
