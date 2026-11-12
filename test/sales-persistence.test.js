import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createSalesLine
} from "../src/sales-form.js";

const root = fileURLToPath(new URL("..", import.meta.url));

async function loadSalesPersistence() {
  const modulePath = join(root, "src", "sales-persistence.js");

  assert.equal(existsSync(modulePath), true, "src/sales-persistence.js is missing");

  return import("../src/sales-persistence.js");
}

test("Day 041 prepares a sales transaction payload with server-controlled store_id", async () => {
  const { prepareSalesOrderTransaction } = await loadSalesPersistence();
  const result = prepareSalesOrderTransaction({
    draft: {
      customer: {
        id: "customer-1",
        name: "Store Customer",
        storeId: "attacker-store"
      },
      lines: [
        createSalesLine(
          {
            id: "product-1",
            storeId: "attacker-store",
            name: "Primer",
            spec: "18L",
            unit: "bucket",
            salePrice: 168,
            currentStock: 6
          },
          { quantity: 2, discountAmount: 6 }
        )
      ],
      paymentAmount: 100,
      notes: "deliver today",
      store_id: "attacker-store"
    },
    storeContext: activeStoreContext("store-a"),
    orderDate: "2026-06-30"
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.allowed, true);
  assert.equal(result.payload.store_id, "store-a");
  assert.equal(result.payload.customer_id, "customer-1");
  assert.equal(result.payload.order_date, "2026-06-30");
  assert.equal(result.payload.subtotal, 336);
  assert.equal(result.payload.discount_amount, 6);
  assert.equal(result.payload.total_amount, 330);
  assert.equal(result.payload.payment_amount, 100);
  assert.equal(result.payload.receivable_delta, 230);
  assert.equal(result.payload.payment_status, "partial");
  assert.deepEqual(result.payload.lines, [
    {
      product_id: "product-1",
      product_name_snapshot: "Primer",
      spec_snapshot: "18L",
      quantity: 2,
      unit: "bucket",
      unit_price: 168,
      discount_amount: 6,
      line_total: 330
    }
  ]);
});

test("Day 041 rejects missing store, missing persisted ids, insufficient stock, and overpayment before RPC", async () => {
  const { prepareSalesOrderTransaction } = await loadSalesPersistence();
  const baseDraft = {
    customer: {
      id: "customer-1",
      name: "Store Customer"
    },
    lines: [
      createSalesLine(
        {
          id: "product-1",
          name: "Primer",
          spec: "18L",
          unit: "bucket",
          salePrice: 168,
          currentStock: 6
        },
        { quantity: 2 }
      )
    ],
    paymentAmount: 10,
    notes: ""
  };

  assert.equal(
    prepareSalesOrderTransaction({
      draft: baseDraft,
      storeContext: { ready: true, activeStore: null, role: null }
    }).reason,
    "missing_store_context"
  );

  assert.deepEqual(
    prepareSalesOrderTransaction({
      draft: {
        ...baseDraft,
        customer: { name: "Local Only Customer" }
      },
      storeContext: activeStoreContext("store-a")
    }).errors,
    { customer: "sales_customer_id_required" }
  );

  assert.deepEqual(
    prepareSalesOrderTransaction({
      draft: {
        ...baseDraft,
        lines: [
          {
            ...baseDraft.lines[0],
            productId: ""
          }
        ]
      },
      storeContext: activeStoreContext("store-a")
    }).errors,
    { lines: "sales_product_id_required" }
  );

  assert.deepEqual(
    prepareSalesOrderTransaction({
      draft: {
        ...baseDraft,
        lines: [
          createSalesLine(
            {
              id: "product-1",
              name: "Primer",
              spec: "18L",
              unit: "bucket",
              salePrice: 168,
              currentStock: 1
            },
            { quantity: 2 }
          )
        ]
      },
      storeContext: activeStoreContext("store-a")
    }).errors,
    { inventory: "sales_stock_insufficient" }
  );

  assert.deepEqual(
    prepareSalesOrderTransaction({
      draft: {
        ...baseDraft,
        paymentAmount: 999
      },
      storeContext: activeStoreContext("store-a")
    }).errors,
    { paymentAmount: "sales_payment_exceeds_total" }
  );
});

test("Day 041 sends prepared sales orders through a single RPC transaction", async () => {
  const { saveSalesOrderTransaction } = await loadSalesPersistence();
  const calls = [];
  const result = await saveSalesOrderTransaction({
    client: fakeRpcClient(calls, {
      id: "sales-order-1",
      order_number: "SO-20260630-001"
    }),
    storeContext: activeStoreContext("store-a"),
    draft: {
      customer: {
        id: "customer-1",
        name: "Store Customer"
      },
      lines: [
        createSalesLine(
          {
            id: "product-1",
            name: "Primer",
            spec: "18L",
            unit: "bucket",
            salePrice: 168,
            currentStock: 6
          },
          { quantity: 2 }
        )
      ],
      paymentAmount: 100,
      notes: ""
    },
    orderDate: "2026-06-30"
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.saved, {
    id: "sales-order-1",
    order_number: "SO-20260630-001"
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "rpc");
  assert.equal(calls[0][1], "save_sales_order_transaction");
  assert.equal(calls[0][2].p_payload.store_id, "store-a");
  assert.equal(calls[0][2].p_payload.lines[0].product_id, "product-1");
});

test("sales API failure reasons are shown as actionable owner messages", async () => {
  const { formatSalesApiErrorMessage } = await import("../src/sales-api-errors.js");

  assert.equal(
    formatSalesApiErrorMessage({ paymentAmount: "sales_payment_exceeds_total" }),
    "本次收款不能大于销售合计。"
  );
  assert.equal(
    formatSalesApiErrorMessage({ sales: "missing_store_context" }),
    "当前账号没有可用门店，销售单未写入数据库。"
  );
  assert.equal(
    formatSalesApiErrorMessage({ sales: "Could not find the function public.save_sales_order_transaction" }),
    "数据库销售事务函数未部署，请在 Supabase SQL Editor 执行 supabase/migrations/0003_sales_order_transaction.sql 后重试。"
  );
});

test("Day 041 route, UI, and migration define the sales persistence boundary", () => {
  const routePath = join(root, "app", "api", "sales", "orders", "route.js");
  const clientPath = join(root, "app", "sales", "SalesFormClient.js");
  const pagePath = join(root, "app", "sales", "page.js");
  const migrationPath = join(root, "supabase", "migrations", "0003_sales_order_transaction.sql");

  assert.ok(existsSync(routePath), "app/api/sales/orders/route.js is missing");
  assert.ok(existsSync(migrationPath), "Day 041 migration is missing");

  const route = readFileSync(routePath, "utf8");
  const client = readFileSync(clientPath, "utf8");
  const page = readFileSync(pagePath, "utf8");
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(route, /saveSalesOrderTransaction/);
  assert.match(client, /\/api\/sales\/orders/);
  assert.match(client, /formatSalesApiErrorMessage/);
  assert.match(client, /createBrowserSupabaseClient/);
  assert.match(page, /useDatabasePageData/);
  assert.match(page, /initialSavedOrders/);
  assert.match(page, /onSaved/);
  assert.match(migration, /create or replace function public\.save_sales_order_transaction/);
  assert.match(migration, /for update/);
  assert.match(migration, /current_stock/);
  assert.match(migration, /inventory_movements/);
  assert.match(migration, /receivable_balance/);
  assert.match(migration, /notify\s+pgrst,\s*'reload schema'/i);
  assert.doesNotMatch(client, /已本地保存|本地销售单|\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});

test("Day 041 documentation records sales transaction boundary", () => {
  const sprintDoc = readFileSync(join(root, "docs", "sprints", "day041_sales_order_write_transaction.md"), "utf8");
  const readme = readFileSync(join(root, "docs/development-history.md"), "utf8");

  assert.match(sprintDoc, /Day 041 Sales Order Write Transaction/);
  assert.match(sprintDoc, /server-side transaction/);
  assert.match(sprintDoc, /insufficient stock/);
  assert.match(sprintDoc, /Payments, audit logs, backups, deployment, and purchase writes remain outside this sprint/);
  assert.match(readme, /Day 041 adds a server-side sales order transaction path/);
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

function fakeRpcClient(calls, savedRow) {
  return {
    rpc(name, args) {
      calls.push(["rpc", name, args]);

      return Promise.resolve({
        data: savedRow,
        error: null
      });
    }
  };
}
