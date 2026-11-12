export const requiredRlsEvidenceChecks = [
  evidenceCheck({
    id: "development_migration_applied",
    label: "Day 034 development migration applied",
    evidence: "Record the development project ref and SQL execution timestamp."
  }),
  evidenceCheck({
    id: "catalog_rls_enabled",
    label: "Catalog tables have row level security enabled",
    evidence: "Confirm products, customers, and suppliers report row security as enabled."
  }),
  evidenceCheck({
    id: "catalog_select_policies_present",
    label: "Catalog select policies are present",
    evidence: "Confirm store-scoped select policies exist for products, customers, and suppliers."
  }),
  evidenceCheck({
    id: "anon_key_does_not_bypass_rls",
    label: "Anon key cannot bypass RLS",
    evidence: "Use the publishable anon key without a user session and record the blocked or empty result."
  }),
  evidenceCheck({
    id: "store_member_reads_own_store",
    label: "Store member can read own store rows",
    evidence: "Sign in as a development store member and record own-store catalog row counts."
  }),
  evidenceCheck({
    id: "store_member_cannot_read_other_store",
    label: "Store member cannot read another store",
    evidence: "With the same user, record that another store's catalog rows are not visible."
  })
];

export function buildDevelopmentRlsEvidencePlan({
  projectRef = "",
  completedCheckIds = []
} = {}) {
  const completed = new Set(completedCheckIds);
  const remainingCheckIds = requiredRlsEvidenceChecks
    .map((check) => check.id)
    .filter((id) => !completed.has(id));

  return {
    mode: "development_rls_evidence",
    projectRef: String(projectRef ?? "").trim(),
    requiredChecks: requiredRlsEvidenceChecks,
    completedCheckIds: requiredRlsEvidenceChecks
      .map((check) => check.id)
      .filter((id) => completed.has(id)),
    remainingCheckIds,
    readyForPilotReadReview: remainingCheckIds.length === 0,
    evidenceSqlFile: "docs/supabase/day037_rls_evidence_checks.sql",
    migrationSqlFile: "docs/supabase/day034_development_migration.sql",
    blockedOperations: [
      "production_write",
      "live_sales_order_write",
      "catalog_write",
      "sales_transaction_write",
      "purchase_transaction_write"
    ]
  };
}

function evidenceCheck({ id, label, evidence }) {
  return {
    id,
    label,
    evidence,
    required: true,
    recordsSecret: false
  };
}
