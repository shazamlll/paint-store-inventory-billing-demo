import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function loadCatalogPersistence() {
  const modulePath = join(root, "src", "catalog-persistence.js");

  assert.equal(existsSync(modulePath), true, "src/catalog-persistence.js is missing");

  return import("../src/catalog-persistence.js");
}

test("Day 040 maps product catalog writes with server-controlled store_id", async () => {
  const { prepareProductCatalogInsert } = await loadCatalogPersistence();
  const result = prepareProductCatalogInsert({
    draft: {
      name: "  Primer  ",
      spec: "  18L ",
      unit: " bucket ",
      costPrice: "120",
      salePrice: "168",
      currentStock: "6",
      lowStockThreshold: "2",
      store_id: "attacker-store"
    },
    storeContext: activeStoreContext("store-a")
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.row.store_id, "store-a");
  assert.equal(result.row.name, "Primer");
  assert.equal(result.row.spec, "18L");
  assert.equal(result.row.cost_price, 120);
  assert.equal(result.row.sale_price, 168);
  assert.equal(result.row.current_stock, 6);
  assert.equal(result.row.low_stock_threshold, 2);
});

test("Day 040 blocks catalog writes without an active store context", async () => {
  const { prepareCustomerCatalogInsert } = await loadCatalogPersistence();
  const result = prepareCustomerCatalogInsert({
    draft: {
      name: "Store Customer",
      phone: "13800000000",
      notes: "pilot",
      receivableBalance: "0"
    },
    storeContext: {
      ready: true,
      activeStore: null,
      role: null
    }
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "missing_store_context");
  assert.equal(result.row, null);
});

test("Day 040 writes catalog rows through injected Supabase clients only after validation", async () => {
  const { saveCatalogProduct } = await loadCatalogPersistence();
  const calls = [];
  const result = await saveCatalogProduct({
    client: fakeMutationClient(calls, { id: "product-1" }),
    storeContext: activeStoreContext("store-a"),
    draft: {
      name: "Wall Paint",
      spec: "5L",
      unit: "bucket",
      costPrice: "40",
      salePrice: "68",
      currentStock: "10",
      lowStockThreshold: "3"
    }
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.saved.id, "product-1");
  assert.deepEqual(calls, [
    ["from", "products"],
    [
      "insert",
      {
        store_id: "store-a",
        name: "Wall Paint",
        spec: "5L",
        unit: "bucket",
        cost_price: 40,
        sale_price: 68,
        current_stock: 10,
        low_stock_threshold: 3
      }
    ],
    ["select", "id"],
    ["single"]
  ]);
});

test("catalog persistence deletes product and customer rows within the active store", async () => {
  const {
    deleteCatalogCustomer,
    deleteCatalogProduct
  } = await loadCatalogPersistence();
  const calls = [];

  assert.deepEqual(
    await deleteCatalogProduct({
      client: fakeDeleteClient(calls, { id: "product-1" }),
      storeContext: activeStoreContext("store-a"),
      id: "product-1"
    }),
    {
      errors: {},
      deleted: { id: "product-1" }
    }
  );
  assert.deepEqual(
    await deleteCatalogCustomer({
      client: fakeDeleteClient(calls, { id: "customer-1" }),
      storeContext: activeStoreContext("store-a"),
      id: "customer-1"
    }),
    {
      errors: {},
      deleted: { id: "customer-1" }
    }
  );
  assert.deepEqual(calls, [
    ["from", "products"],
    ["delete"],
    ["eq", "id", "product-1"],
    ["eq", "store_id", "store-a"],
    ["select", "id"],
    ["single"],
    ["from", "customers"],
    ["delete"],
    ["eq", "id", "customer-1"],
    ["eq", "store_id", "store-a"],
    ["select", "id"],
    ["single"]
  ]);
});

test("catalog delete rejects missing ids before touching Supabase", async () => {
  const { deleteCatalogProduct } = await loadCatalogPersistence();
  const calls = [];
  const result = await deleteCatalogProduct({
    client: fakeDeleteClient(calls, { id: "product-1" }),
    storeContext: activeStoreContext("store-a"),
    id: ""
  });

  assert.deepEqual(result, {
    errors: {
      catalog: "catalog_delete_id_required"
    },
    deleted: null
  });
  assert.deepEqual(calls, []);
});

test("Day 040 import plan scopes approved CSV batches to the active development store", async () => {
  const { buildDevelopmentCatalogImportPlan } = await loadCatalogPersistence();
  const plan = buildDevelopmentCatalogImportPlan({
    storeContext: activeStoreContext("store-a"),
    validation: {
      ready: true,
      batches: [
        { id: "products", rows: 2, targetTable: "products" },
        { id: "customers", rows: 1, targetTable: "customers" },
        { id: "suppliers", rows: 1, targetTable: "suppliers" }
      ]
    }
  });

  assert.equal(plan.mode, "development_catalog_import_plan");
  assert.equal(plan.canWriteToDevelopment, true);
  assert.equal(plan.productionWritesAllowed, false);
  assert.deepEqual(
    plan.steps.map((step) => [step.sourceId, step.storeId, step.targetTable]),
    [
      ["products", "store-a", "products"],
      ["customers", "store-a", "customers"],
      ["suppliers", "store-a", "suppliers"]
    ]
  );
});

test("Day 040 API routes and UI keep catalog writes out of the browser Supabase client", () => {
  const productRoute = readFileSync(join(root, "app", "api", "catalog", "products", "route.js"), "utf8");
  const customerRoute = readFileSync(join(root, "app", "api", "catalog", "customers", "route.js"), "utf8");
  const productClient = readFileSync(join(root, "app", "products", "editor", "ProductEditorClient.js"), "utf8");
  const customerClient = readFileSync(join(root, "app", "customers", "CustomerListClient.js"), "utf8");

  assert.match(productRoute, /saveCatalogProduct/);
  assert.match(customerRoute, /saveCatalogCustomer/);
  assert.match(productRoute, /deleteCatalogProduct/);
  assert.match(customerRoute, /deleteCatalogCustomer/);
  assert.match(productRoute, /export async function DELETE/);
  assert.match(customerRoute, /export async function DELETE/);
  assert.match(productClient, /\/api\/catalog\/products/);
  assert.match(customerClient, /\/api\/catalog\/customers/);
  assert.doesNotMatch(`${productClient}\n${customerClient}`, /\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});

test("Day 040 documentation records catalog persistence boundary", () => {
  const sprintDoc = readFileSync(join(root, "docs", "sprints", "day040_catalog_persistence_import_path.md"), "utf8");
  const readme = readFileSync(join(root, "docs/development-history.md"), "utf8");

  assert.match(sprintDoc, /Day 040 Catalog Persistence and Import Path/);
  assert.match(sprintDoc, /catalog/i);
  assert.match(sprintDoc, /server-controlled `store_id`/);
  assert.match(sprintDoc, /Sales, purchase, inventory, payment, audit, and backup work remain blocked/);
  assert.match(readme, /Day 040 adds a development catalog persistence path/);
});

function activeStoreContext(storeId) {
  return {
    ready: true,
    activeStore: {
      id: storeId,
      name: "Pilot Store"
    },
    role: "owner"
  };
}

function fakeMutationClient(calls, savedRow) {
  return {
    from(table) {
      calls.push(["from", table]);
      return {
        insert(row) {
          calls.push(["insert", row]);
          return this;
        },
        select(columns) {
          calls.push(["select", columns]);
          return this;
        },
        single() {
          calls.push(["single"]);
          return Promise.resolve({
            data: savedRow,
            error: null
          });
        }
      };
    }
  };
}

function fakeDeleteClient(calls, deletedRow) {
  return {
    from(table) {
      calls.push(["from", table]);

      return {
        delete() {
          calls.push(["delete"]);
          return this;
        },
        eq(column, value) {
          calls.push(["eq", column, value]);
          return this;
        },
        select(columns) {
          calls.push(["select", columns]);
          return this;
        },
        single() {
          calls.push(["single"]);
          return Promise.resolve({
            data: deletedRow,
            error: null
          });
        }
      };
    }
  };
}
