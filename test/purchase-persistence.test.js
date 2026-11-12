import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { createPurchaseLine } from "../src/purchase-form.js";

const root = fileURLToPath(new URL("..", import.meta.url));

async function loadPurchasePersistence() {
  const modulePath = join(root, "src", "purchase-persistence.js");

  assert.equal(existsSync(modulePath), true, "src/purchase-persistence.js is missing");

  return import("../src/purchase-persistence.js");
}

test("Day 042 maps Supabase supplier rows for purchase receiving", async () => {
  const { mapSupabaseSupplierRow } = await import("../src/development-page-reads.js");

  assert.deepEqual(
    mapSupabaseSupplierRow({
      id: "supplier-1",
      store_id: "store-a",
      name: "Remote Supplier",
      phone: "13600000000",
      notes: null,
      payable_balance: "88.60"
    }),
    {
      id: "supplier-1",
      storeId: "store-a",
      name: "Remote Supplier",
      phone: "13600000000",
      notes: "",
      payableBalance: 88.6
    }
  );
});

test("purchase transaction creates a typed supplier before saving when no supplier id exists", async () => {
  const { savePurchaseOrderTransaction } = await import("../src/purchase-persistence.js");
  const calls = [];
  const result = await savePurchaseOrderTransaction({
    client: fakePurchaseClientWithSupplierProvision(calls, { id: "supplier-created" }),
    storeContext: activeStoreContext("store-a"),
    draft: {
      supplier: {
        name: "湖州临时供应商"
      },
      lines: [
        {
          productId: "product-1",
          productNameSnapshot: "内墙乳胶漆",
          specSnapshot: "白色 1 加仑",
          unit: "罐",
          quantity: 2,
          unitCost: 18,
          lineTotal: 36
        }
      ],
      paymentAmount: 0,
      notes: ""
    },
    receivedDate: "2026-06-23"
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.saved.order_number, "PO-20260623-001");
  assert.deepEqual(calls, [
    ["from", "suppliers"],
    ["select", "id"],
    ["eq", "store_id", "store-a"],
    ["eq", "name", "湖州临时供应商"],
    ["maybeSingle"],
    ["from", "suppliers"],
    [
      "insert",
      {
        store_id: "store-a",
        name: "湖州临时供应商",
        phone: "",
        notes: "采购入库自动创建",
        payable_balance: 0
      }
    ],
    ["select", "id"],
    ["single"],
    ["rpc", "save_purchase_order_transaction", "supplier-created"]
  ]);
});

test("Day 042 prepares a purchase transaction payload with server-controlled store_id", async () => {
  const { preparePurchaseOrderTransaction } = await loadPurchasePersistence();
  const result = preparePurchaseOrderTransaction({
    draft: {
      supplier: {
        id: "supplier-1",
        name: "Remote Supplier",
        storeId: "attacker-store"
      },
      lines: [
        createPurchaseLine(
          {
            id: "product-1",
            storeId: "attacker-store",
            name: "Primer",
            spec: "18L",
            unit: "bucket",
            costPrice: 120,
            currentStock: 6
          },
          { quantity: 3, unitCost: 118 }
        )
      ],
      paymentAmount: 100,
      notes: "morning delivery",
      store_id: "attacker-store"
    },
    storeContext: activeStoreContext("store-a"),
    receivedDate: "2026-06-30"
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.allowed, true);
  assert.equal(result.payload.store_id, "store-a");
  assert.equal(result.payload.supplier_id, "supplier-1");
  assert.equal(result.payload.received_date, "2026-06-30");
  assert.equal(result.payload.subtotal, 354);
  assert.equal(result.payload.total_amount, 354);
  assert.equal(result.payload.payment_amount, 100);
  assert.equal(result.payload.payable_delta, 254);
  assert.equal(result.payload.payment_status, "partial");
  assert.deepEqual(result.payload.lines, [
    {
      product_id: "product-1",
      product_name_snapshot: "Primer",
      spec_snapshot: "18L",
      quantity: 3,
      unit: "bucket",
      unit_cost: 118,
      line_total: 354
    }
  ]);
});

test("Day 042 rejects missing store, missing persisted ids, invalid cost, and overpayment before RPC", async () => {
  const { preparePurchaseOrderTransaction } = await loadPurchasePersistence();
  const baseDraft = {
    supplier: {
      id: "supplier-1",
      name: "Remote Supplier"
    },
    lines: [
      createPurchaseLine(
        {
          id: "product-1",
          name: "Primer",
          spec: "18L",
          unit: "bucket",
          costPrice: 120,
          currentStock: 6
        },
        { quantity: 2 }
      )
    ],
    paymentAmount: 10,
    notes: ""
  };

  assert.equal(
    preparePurchaseOrderTransaction({
      draft: baseDraft,
      storeContext: { ready: true, activeStore: null, role: null }
    }).reason,
    "missing_store_context"
  );

  assert.deepEqual(
    preparePurchaseOrderTransaction({
      draft: {
        ...baseDraft,
        supplier: { name: "Local Only Supplier" }
      },
      storeContext: activeStoreContext("store-a")
    }).errors,
    { supplier: "purchase_supplier_id_required" }
  );

  assert.deepEqual(
    preparePurchaseOrderTransaction({
      draft: {
        ...baseDraft,
        lines: [{ ...baseDraft.lines[0], productId: "" }]
      },
      storeContext: activeStoreContext("store-a")
    }).errors,
    { lines: "purchase_product_id_required" }
  );

  assert.deepEqual(
    preparePurchaseOrderTransaction({
      draft: {
        ...baseDraft,
        lines: [
          createPurchaseLine(
            {
              id: "product-1",
              name: "Primer",
              spec: "18L",
              unit: "bucket",
              costPrice: -1,
              currentStock: 6
            },
            { quantity: 2, unitCost: -1 }
          )
        ]
      },
      storeContext: activeStoreContext("store-a")
    }).errors,
    { lines: "purchase_unit_cost_invalid" }
  );

  assert.deepEqual(
    preparePurchaseOrderTransaction({
      draft: {
        ...baseDraft,
        paymentAmount: 999
      },
      storeContext: activeStoreContext("store-a")
    }).errors,
    { paymentAmount: "purchase_payment_exceeds_total" }
  );
});

test("Day 042 sends prepared purchase receiving through a single RPC transaction", async () => {
  const { savePurchaseOrderTransaction } = await loadPurchasePersistence();
  const calls = [];
  const result = await savePurchaseOrderTransaction({
    client: fakeRpcClient(calls, {
      id: "purchase-order-1",
      order_number: "PO-20260630-001"
    }),
    storeContext: activeStoreContext("store-a"),
    draft: {
      supplier: {
        id: "supplier-1",
        name: "Remote Supplier"
      },
      lines: [
        createPurchaseLine(
          {
            id: "product-1",
            name: "Primer",
            spec: "18L",
            unit: "bucket",
            costPrice: 120,
            currentStock: 6
          },
          { quantity: 3 }
        )
      ],
      paymentAmount: 100,
      notes: ""
    },
    receivedDate: "2026-06-30"
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.saved, {
    id: "purchase-order-1",
    order_number: "PO-20260630-001"
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "rpc");
  assert.equal(calls[0][1], "save_purchase_order_transaction");
  assert.equal(calls[0][2].p_payload.store_id, "store-a");
  assert.equal(calls[0][2].p_payload.lines[0].product_id, "product-1");
});

test("Day 042 route, UI, and migration define the purchase persistence boundary", () => {
  const routePath = join(root, "app", "api", "purchases", "orders", "route.js");
  const clientPath = join(root, "app", "purchases", "PurchaseFormClient.js");
  const pagePath = join(root, "app", "purchases", "page.js");
  const migrationPath = join(root, "supabase", "migrations", "0004_purchase_order_transaction.sql");

  assert.ok(existsSync(routePath), "app/api/purchases/orders/route.js is missing");
  assert.ok(existsSync(migrationPath), "Day 042 migration is missing");

  const route = readFileSync(routePath, "utf8");
  const client = readFileSync(clientPath, "utf8");
  const page = readFileSync(pagePath, "utf8");
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(route, /savePurchaseOrderTransaction/);
  assert.match(client, /\/api\/purchases\/orders/);
  assert.match(client, /createBrowserSupabaseClient/);
  assert.match(page, /useDatabasePageData/);
  assert.match(page, /initialSavedOrders/);
  assert.match(page, /onSaved/);
  assert.match(migration, /create or replace function public\.save_purchase_order_transaction/);
  assert.match(migration, /for update/);
  assert.match(migration, /current_stock/);
  assert.match(migration, /inventory_movements/);
  assert.match(migration, /payable_balance/);
  assert.doesNotMatch(client, /已本地保存|本地入库单|supabase\.from|\.from\(|\.insert\(|\.update\(|\.upsert\(/);
});

test("Day 042 documentation records purchase transaction boundary", () => {
  const sprintDoc = readFileSync(join(root, "docs", "sprints", "day042_purchase_receiving_write_transaction.md"), "utf8");
  const readme = readFileSync(join(root, "docs/development-history.md"), "utf8");

  assert.match(sprintDoc, /Day 042 Purchase Receiving Write Transaction/);
  assert.match(sprintDoc, /server-side transaction/);
  assert.match(sprintDoc, /supplier payable/);
  assert.match(sprintDoc, /Payments, audit logs, backups, deployment, and standalone payment workflows remain outside this sprint/);
  assert.match(readme, /Day 042 adds a server-side purchase receiving transaction path/);
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

function fakePurchaseClientWithSupplierProvision(calls, createdSupplier) {
  return {
    from(table) {
      calls.push(["from", table]);

      return {
        select(columns) {
          calls.push(["select", columns]);
          return this;
        },
        eq(column, value) {
          calls.push(["eq", column, value]);
          return this;
        },
        maybeSingle() {
          calls.push(["maybeSingle"]);
          return Promise.resolve({
            data: null,
            error: null
          });
        },
        insert(row) {
          calls.push(["insert", row]);
          return this;
        },
        single() {
          calls.push(["single"]);
          return Promise.resolve({
            data: createdSupplier,
            error: null
          });
        }
      };
    },
    rpc(name, args) {
      calls.push(["rpc", name, args.p_payload.supplier_id]);

      return Promise.resolve({
        data: {
          id: "purchase-order-1",
          order_number: "PO-20260623-001"
        },
        error: null
      });
    }
  };
}
