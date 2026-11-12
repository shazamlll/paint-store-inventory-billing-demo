import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function loadStoreContextModule() {
  const modulePath = join(root, "src", "store-context.js");

  assert.equal(existsSync(modulePath), true, "src/store-context.js is missing");

  return import("../src/store-context.js");
}

test("Day 039 loads active store memberships for the signed-in user", async () => {
  const { loadStoreContext } = await loadStoreContextModule();
  const calls = [];
  const context = await loadStoreContext({
    client: fakeMembershipClient(calls, [
      {
        id: "membership-1",
        store_id: "store-a",
        role: "owner",
        stores: {
          id: "store-a",
          name: "北城涂料店",
          active: true
        }
      }
    ]),
    session: {
      user: {
        id: "user-a"
      }
    }
  });

  assert.deepEqual(calls, [
    ["from", "store_members"],
    ["select", "id,store_id,role,active,stores(id,name,active)"],
    ["eq", "user_id", "user-a"],
    ["eq", "active", true],
    ["order", "created_at", { ascending: true }]
  ]);
  assert.equal(context.ready, true);
  assert.equal(context.userId, "user-a");
  assert.equal(context.activeStore.id, "store-a");
  assert.equal(context.role, "owner");
  assert.equal(context.memberships.length, 1);
});

test("Day 039 store context reloads only when the signed-in user changes", async () => {
  const { shouldLoadStoreContext } = await loadStoreContextModule();

  assert.equal(
    shouldLoadStoreContext({
      authReady: true,
      hasAuthClient: true,
      userId: "user-a",
      storeContext: {
        ready: true,
        userId: "user-a",
        activeStore: { id: "store-a" },
        role: "owner"
      }
    }),
    false
  );
  assert.equal(
    shouldLoadStoreContext({
      authReady: true,
      hasAuthClient: true,
      userId: "user-b",
      storeContext: {
        ready: true,
        userId: "user-a",
        activeStore: { id: "store-a" },
        role: "owner"
      }
    }),
    true
  );
  assert.equal(
    shouldLoadStoreContext({
      authReady: false,
      hasAuthClient: true,
      userId: "user-a",
      storeContext: null
    }),
    false
  );
});

test("Day 039 role gates allow owner work and block clerk-only gaps", async () => {
  const { buildStoreAccessGate } = await loadStoreContextModule();
  const ownerContext = storeContext("owner");
  const clerkContext = storeContext("clerk");
  const accountantContext = storeContext("accountant");

  assert.deepEqual(buildStoreAccessGate({ pathname: "/inventory/adjustments", storeContext: ownerContext }), {
    allowed: true,
    reason: "role_allowed",
    redirectTo: null
  });
  assert.deepEqual(buildStoreAccessGate({ pathname: "/inventory/adjustments", storeContext: clerkContext }), {
    allowed: false,
    reason: "role_forbidden",
    redirectTo: "/"
  });
  assert.equal(buildStoreAccessGate({ pathname: "/sales", storeContext: clerkContext }).allowed, true);
  assert.equal(buildStoreAccessGate({ pathname: "/reports/daily", storeContext: accountantContext }).allowed, true);
  assert.equal(buildStoreAccessGate({ pathname: "/sales", storeContext: accountantContext }).allowed, false);
});

test("Day 039 navigation can be filtered by active role", async () => {
  const { filterNavigationGroupsByRole } = await loadStoreContextModule();
  const groups = [
    {
      id: "daily",
      label: "daily",
      items: [
        { href: "/sales", label: "sales" },
        { href: "/reports/daily", label: "report" }
      ]
    },
    {
      id: "inventory",
      label: "inventory",
      items: [
        { href: "/inventory", label: "inventory" },
        { href: "/inventory/adjustments", label: "adjustments" }
      ]
    }
  ];

  assert.deepEqual(
    filterNavigationGroupsByRole(groups, "clerk").flatMap((group) => group.items.map((item) => item.href)),
    ["/sales", "/inventory"]
  );
  assert.deepEqual(
    filterNavigationGroupsByRole(groups, "accountant").flatMap((group) => group.items.map((item) => item.href)),
    ["/reports/daily"]
  );
});

test("Day 039 migration grants authenticated store context reads", () => {
  const sql = readFileSync(join(root, "supabase", "migrations", "0002_multi_tenant_rls.sql"), "utf8").toLowerCase();

  assert.match(sql, /grant select on public\.stores to authenticated/);
  assert.match(sql, /grant select on public\.store_members to authenticated/);
});

test("Day 039 store gate copy distinguishes missing store context from role denial", async () => {
  const { getStoreGatePanelCopy } = await loadStoreContextModule();

  assert.equal(
    getStoreGatePanelCopy({
      storeGate: { reason: "loading_store_context" },
      storeContext: { ready: false }
    }).title,
    "正在加载门店权限"
  );
  assert.equal(
    getStoreGatePanelCopy({
      storeGate: { reason: "missing_store_context" },
      storeContext: { ready: true, error: "permission denied" }
    }).title,
    "门店权限读取失败"
  );
  assert.equal(
    getStoreGatePanelCopy({
      storeGate: { reason: "missing_store_context" },
      storeContext: { ready: true, error: null }
    }).title,
    "未找到可用门店"
  );
  assert.equal(
    getStoreGatePanelCopy({
      storeGate: { reason: "role_forbidden" },
      storeContext: { ready: true, error: null }
    }).title,
    "当前角色不能访问此页面"
  );
});

test("Day 039 app shell loads store context and applies role filtered navigation", () => {
  const shell = readFileSync(join(root, "app", "AppShell.js"), "utf8");

  assert.match(shell, /loadStoreContext/);
  assert.match(shell, /buildStoreAccessGate/);
  assert.match(shell, /shouldLoadStoreContext/);
  assert.match(shell, /sessionUserId/);
  assert.match(shell, /getStoreGatePanelCopy/);
  assert.match(shell, /filterNavigationGroupsByRole/);
  assert.match(shell, /activeStore/);
});

test("Day 039 sprint doc records store context boundary", () => {
  const docPath = join(root, "docs", "sprints", "day039_store_context_role_authorization.md");

  assert.equal(existsSync(docPath), true, "Day 039 sprint doc is missing");

  const doc = readFileSync(docPath, "utf8");

  assert.match(doc, /Day 039 Store Context and Role Authorization/);
  assert.match(doc, /store_members/);
  assert.match(doc, /owner/);
  assert.match(doc, /clerk/);
  assert.match(doc, /business writes remain blocked/i);
});

function fakeMembershipClient(calls, rows) {
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
        order(column, options) {
          calls.push(["order", column, options]);
          return Promise.resolve({
            data: rows,
            error: null
          });
        }
      };
    }
  };
}

function storeContext(role) {
  return {
    ready: true,
    userId: "user-a",
    role,
    activeStore: {
      id: "store-a",
      name: "北城涂料店"
    }
  };
}
