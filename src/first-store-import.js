import { pilotImportTemplates } from "./pilot-intake.js";

const targetTables = {
  products: "products",
  customers: "customers",
  suppliers: "suppliers",
  opening_stock: "inventory_movements",
  opening_receivables: "customers"
};

const actions = {
  products: "validate_then_insert_products_with_store_id",
  customers: "validate_then_insert_customers_with_store_id",
  suppliers: "validate_then_insert_suppliers_with_store_id",
  opening_stock: "validate_then_prepare_opening_stock_movements",
  opening_receivables: "validate_then_apply_customer_opening_receivables"
};

export const firstStoreImportSources = pilotImportTemplates.map((template) => ({
  id: template.id,
  templateFile: template.fileName,
  targetTable: targetTables[template.id],
  headers: template.headers,
  action: actions[template.id],
  requiresStoreId: true
}));

export function validateFirstStoreImportFiles(files = {}) {
  const missingSources = [];
  const headerErrors = [];
  const batches = [];

  for (const source of firstStoreImportSources) {
    const csv = files[source.id];

    if (!csv) {
      missingSources.push(source.id);
      continue;
    }

    const headers = readHeaders(csv);

    if (!sameHeaders(headers, source.headers)) {
      headerErrors.push({
        id: source.id,
        message: `${source.id} headers must match ${source.templateFile}`,
        expected: source.headers,
        actual: headers
      });
      continue;
    }

    batches.push({
      id: source.id,
      sourceFile: source.templateFile,
      targetTable: source.targetTable,
      action: source.action,
      rows: countRows(csv),
      requiresStoreId: source.requiresStoreId
    });
  }

  return {
    mode: "dry_run",
    ready: missingSources.length === 0 && headerErrors.length === 0,
    canWriteToSupabase: false,
    missingSources,
    headerErrors,
    batches,
    blockedOperations: ["production_supabase_write", "live_sales_order_write"]
  };
}

export function buildFirstStoreImportDryRun({ store, files }) {
  const validation = validateFirstStoreImportFiles(files);
  const importSteps = validation.batches.map((batch) => ({
    id: `import_${batch.id}`,
    sourceId: batch.id,
    targetTable: batch.targetTable,
    action: batch.action,
    rows: batch.rows,
    requiresStoreId: true
  }));

  return {
    mode: "dry_run",
    store,
    validation,
    productionWritesAllowed: false,
    steps: [
      {
        id: "create_store",
        action: "prepare_store_record",
        targetTable: "stores"
      },
      {
        id: "create_owner_membership",
        action: "prepare_owner_store_membership",
        targetTable: "store_members"
      },
      ...importSteps
    ],
    notes: [
      "Day 033 only validates and orders the first-store import path.",
      "Run against a development Supabase project before any production write.",
      "Do not import live sales orders until auth, RLS, backup, and audit gates are verified."
    ]
  };
}

function readHeaders(csv) {
  return firstLine(csv).split(",").map((header) => header.trim());
}

function firstLine(csv) {
  return String(csv).split(/\r?\n/)[0] ?? "";
}

function countRows(csv) {
  return String(csv)
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim().length > 0).length;
}

function sameHeaders(actual, expected) {
  return actual.length === expected.length && actual.every((header, index) => header === expected[index]);
}
