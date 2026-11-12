import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const docPath = join(root, "docs", "sprints", "day033_first_store_import_path.md");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function templateCsv(fileName, row) {
  return `${read(`docs/pilot/templates/${fileName}`).trim()}\n${row}`;
}

async function loadFirstStoreImport() {
  const modulePath = join(root, "src", "first-store-import.js");

  assert.equal(existsSync(modulePath), true, "src/first-store-import.js is missing");

  return import("../src/first-store-import.js");
}

test("Day 033 defines a dry-run import source map from Day 031 templates", async () => {
  const { firstStoreImportSources } = await loadFirstStoreImport();

  assert.deepEqual(
    firstStoreImportSources.map((source) => source.id),
    ["products", "customers", "suppliers", "opening_stock", "opening_receivables"]
  );

  for (const source of firstStoreImportSources) {
    assert.ok(source.templateFile.endsWith(".csv"));
    assert.ok(source.targetTable);
    assert.equal(source.requiresStoreId, true);
    assert.notEqual(source.targetTable, "sales_orders");
  }
});

test("Day 033 validates first-store CSV headers without writing to Supabase", async () => {
  const { validateFirstStoreImportFiles } = await loadFirstStoreImport();
  const result = validateFirstStoreImportFiles({
    products: templateCsv("products.csv", "晨阳内墙乳胶漆,18L,桶,120,168,12,3,内墙漆,首店导入样例"),
    customers: templateCsv("customers.csv", "张三施工队,13800000000,老客户,520"),
    suppliers: templateCsv("suppliers.csv", "华东涂料批发,13900000000,主供货商,0"),
    opening_stock: templateCsv("opening_stock.csv", "晨阳内墙乳胶漆,18L,桶,12,首店盘点"),
    opening_receivables: templateCsv("opening_receivables.csv", "张三施工队,13800000000,520,期初欠款,月底前核对")
  });

  assert.equal(result.ready, true);
  assert.equal(result.mode, "dry_run");
  assert.equal(result.canWriteToSupabase, false);
  assert.deepEqual(result.missingSources, []);
  assert.equal(result.batches.length, 5);
  assert.equal(result.batches[0].rows, 1);
  assert.ok(result.blockedOperations.includes("production_supabase_write"));
});

test("Day 033 reports missing files and header mismatches before import", async () => {
  const { validateFirstStoreImportFiles } = await loadFirstStoreImport();
  const result = validateFirstStoreImportFiles({
    products: "name,unit\n晨阳内墙乳胶漆,桶"
  });

  assert.equal(result.ready, false);
  assert.ok(result.missingSources.includes("customers"));
  assert.ok(result.headerErrors.some((error) => error.id === "products"));
  assert.match(result.headerErrors[0].message, /headers/);
});

test("Day 033 builds an ordered first-store import dry run", async () => {
  const { buildFirstStoreImportDryRun } = await loadFirstStoreImport();
  const dryRun = buildFirstStoreImportDryRun({
    store: {
      name: "第一家涂料店",
      ownerName: "店主",
      city: "杭州"
    },
    files: {
      products: templateCsv("products.csv", "晨阳内墙乳胶漆,18L,桶,120,168,12,3,内墙漆,首店导入样例"),
      customers: templateCsv("customers.csv", "张三施工队,13800000000,老客户,520"),
      suppliers: templateCsv("suppliers.csv", "华东涂料批发,13900000000,主供货商,0"),
      opening_stock: templateCsv("opening_stock.csv", "晨阳内墙乳胶漆,18L,桶,12,首店盘点"),
      opening_receivables: templateCsv("opening_receivables.csv", "张三施工队,13800000000,520,期初欠款,月底前核对")
    }
  });

  assert.equal(dryRun.store.name, "第一家涂料店");
  assert.equal(dryRun.validation.ready, true);
  assert.equal(dryRun.steps[0].id, "create_store");
  assert.equal(dryRun.steps[1].id, "create_owner_membership");
  assert.deepEqual(
    dryRun.steps.slice(2).map((step) => step.sourceId),
    ["products", "customers", "suppliers", "opening_stock", "opening_receivables"]
  );
  assert.equal(dryRun.productionWritesAllowed, false);
});

test("Day 033 documentation records import boundary and print constraints", () => {
  assert.equal(existsSync(docPath), true, "Day 033 sprint doc is missing");

  const doc = read("docs/sprints/day033_first_store_import_path.md");

  assert.match(doc, /Day 033 First-Store Import Path/);
  assert.match(doc, /Day 032/);
  assert.match(doc, /不写入真实 Supabase/);
  assert.match(doc, /32 开/);
  assert.match(doc, /预印单据/);
});
