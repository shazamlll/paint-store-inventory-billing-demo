import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function loadDevelopmentPageReads() {
  const modulePath = join(root, "src", "development-page-reads.js");

  assert.equal(existsSync(modulePath), true, "src/development-page-reads.js is missing");

  return import("../src/development-page-reads.js");
}

test("Day 036 maps Supabase product rows into product page records", async () => {
  const { mapSupabaseProductRow } = await loadDevelopmentPageReads();

  assert.deepEqual(
    mapSupabaseProductRow({
      name: "晨阳内墙乳胶漆",
      spec: "18L",
      unit: "桶",
      cost_price: "120.50",
      sale_price: "168.00",
      current_stock: "12.250",
      low_stock_threshold: "3"
    }),
    {
      name: "晨阳内墙乳胶漆",
      spec: "18L",
      unit: "桶",
      costPrice: 120.5,
      salePrice: 168,
      currentStock: 12.25,
      lowStockThreshold: 3
    }
  );
});

test("Day 036 maps Supabase customer rows into customer page records", async () => {
  const { mapSupabaseCustomerRow } = await loadDevelopmentPageReads();

  assert.deepEqual(
    mapSupabaseCustomerRow({
      name: "王师傅",
      phone: "13800000000",
      notes: null,
      receivable_balance: "88.60"
    }),
    {
      name: "王师傅",
      phone: "13800000000",
      notes: "",
      receivableBalance: 88.6
    }
  );
});

test("Day 036 uses Supabase rows when development reads return data", async () => {
  const { loadDevelopmentPageReadData } = await loadDevelopmentPageReads();
  const result = await loadDevelopmentPageReadData({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_example"
    },
    clientFactory: () => fakeReadClient({
      products: [
        {
          name: "远端底漆",
          spec: "20kg",
          unit: "桶",
          cost_price: 80,
          sale_price: 120,
          current_stock: 4,
          low_stock_threshold: 2
        }
      ],
      customers: [
        {
          name: "远端客户",
          phone: "13900000000",
          notes: "试点",
          receivable_balance: 10
        }
      ]
    })
  });

  assert.equal(result.products.source, "supabase");
  assert.equal(result.products.rows[0].name, "远端底漆");
  assert.equal(result.customers.source, "supabase");
  assert.equal(result.customers.rows[0].name, "远端客户");
  assert.equal(result.canWrite, false);
});

test("database page reads return empty Supabase states instead of local sample fallback", async () => {
  const { loadDevelopmentPageReadData } = await loadDevelopmentPageReads();
  const result = await loadDevelopmentPageReadData({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_example"
    },
    clientFactory: () => fakeReadClient({
      products: [],
      customers: []
    })
  });

  assert.equal(result.products.source, "supabase_empty");
  assert.deepEqual(result.products.rows, []);
  assert.match(result.products.notice, /暂无数据库商品/);
  assert.equal(result.customers.source, "supabase_empty");
  assert.deepEqual(result.customers.rows, []);
});

test("database page reads return unavailable states when Supabase reads hang", async () => {
  const { loadDevelopmentPageReadData } = await loadDevelopmentPageReads();
  const result = await Promise.race([
    loadDevelopmentPageReadData({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_example"
      },
      clientFactory: fakeHangingReadClient,
      readTimeoutMs: 5
    }),
    wait(50).then(() => "timed_out")
  ]);

  assert.notEqual(result, "timed_out");
  assert.equal(result.products.source, "supabase_error");
  assert.deepEqual(result.products.rows, []);
  assert.equal(result.customers.source, "supabase_error");
  assert.deepEqual(result.customers.rows, []);
});

test("Day 036 product and customer pages are wired to development Supabase reads", () => {
  const productsPage = readFileSync(join(root, "app", "products", "page.js"), "utf8");
  const customersPage = readFileSync(join(root, "app", "customers", "page.js"), "utf8");
  const customerClient = readFileSync(join(root, "app", "customers", "CustomerListClient.js"), "utf8");
  const databaseHook = readFileSync(join(root, "app", "useDatabasePageData.js"), "utf8");

  assert.match(productsPage, /useDatabasePageData/);
  assert.match(customersPage, /useDatabasePageData/);
  assert.match(databaseHook, /loadDevelopmentPageReadData/);
  assert.match(customersPage, /initialCustomers/);
  assert.match(customerClient, /initialCustomers = \[\]/);
  assert.doesNotMatch(`${productsPage}\n${customersPage}\n${customerClient}`, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
});

function fakeReadClient(rowsByTable) {
  return {
    from(tableName) {
      return {
        select() {
          return {
            order() {
              return {
                limit() {
                  const rows = rowsByTable[tableName] ?? [];

                  if (typeof rows?.then === "function") {
                    return rows;
                  }

                  return Promise.resolve({
                    data: rows,
                    error: null
                  });
                }
              };
            }
          };
        }
      };
    }
  };
}

function fakeHangingReadClient() {
  return fakeReadClient({
    products: new Promise(() => {}),
    customers: new Promise(() => {})
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
