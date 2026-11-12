import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function loadCustomerOnboarding() {
  const modulePath = join(root, "src", "customer-onboarding.js");

  assert.equal(existsSync(modulePath), true, "src/customer-onboarding.js is missing");

  return import("../src/customer-onboarding.js");
}

test("Day 044 builds a repeatable store onboarding checklist from pilot intake", async () => {
  const { buildStoreOnboardingPlan } = await loadCustomerOnboarding();
  const plan = buildStoreOnboardingPlan({
    store: {
      name: "North Paint Store",
      phone: "13800000000",
      address: "Hangzhou",
      notes: "pilot customer"
    },
    owner: {
      name: "Owner Zhang",
      email: "owner@example.com"
    }
  });

  assert.equal(plan.ready, true);
  assert.equal(plan.store.name, "North Paint Store");
  assert.equal(plan.owner.email, "owner@example.com");
  assert.deepEqual(
    plan.steps.map((step) => step.id),
    [
      "create_owner_auth_user",
      "provision_store_owner_membership",
      "import_products",
      "import_customers",
      "import_suppliers",
      "import_opening_stock",
      "import_opening_receivables",
      "verify_store_isolation",
      "handoff_owner_login"
    ]
  );
  assert.equal(plan.steps[0].operator, "support_admin");
  assert.equal(plan.steps[1].target, "provision_store_owner");
  assert.equal(plan.steps.at(-1).blocksDeployment, false);
});

test("Day 044 validates onboarding input before store provisioning", async () => {
  const { buildStoreOnboardingPlan, prepareStoreProvisioningTransaction } = await loadCustomerOnboarding();

  assert.deepEqual(
    buildStoreOnboardingPlan({
      store: { name: "" },
      owner: { email: "not-an-email" }
    }).errors,
    {
      storeName: "store_name_required",
      ownerEmail: "owner_email_invalid"
    }
  );

  assert.deepEqual(
    prepareStoreProvisioningTransaction({
      store: { name: "" },
      session: { user: { id: "user-1" } }
    }).errors,
    {
      storeName: "store_name_required"
    }
  );

  assert.deepEqual(
    prepareStoreProvisioningTransaction({
      store: { name: "North Paint Store" },
      session: null
    }).errors,
    {
      owner: "missing_authenticated_owner"
    }
  );
});

test("Day 044 prepares store provisioning with owner user from the authenticated session", async () => {
  const { prepareStoreProvisioningTransaction } = await loadCustomerOnboarding();
  const result = prepareStoreProvisioningTransaction({
    store: {
      name: "North Paint Store",
      phone: "13800000000",
      address: "Hangzhou",
      notes: "pilot customer",
      owner_user_id: "attacker-user"
    },
    session: {
      user: {
        id: "owner-user-1"
      }
    }
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.allowed, true);
  assert.equal(result.payload.owner_user_id, "owner-user-1");
  assert.equal(result.payload.name, "North Paint Store");
  assert.equal(result.payload.phone, "13800000000");
  assert.equal(result.payload.address, "Hangzhou");
  assert.equal(result.payload.notes, "pilot customer");
});

test("Day 044 sends store onboarding through a single RPC boundary", async () => {
  const { provisionStoreOwner } = await loadCustomerOnboarding();
  const calls = [];
  const result = await provisionStoreOwner({
    client: fakeRpcClient(calls, {
      store_id: "store-b",
      membership_id: "membership-b",
      role: "owner"
    }),
    session: {
      user: {
        id: "owner-user-1"
      }
    },
    store: {
      name: "Second Paint Store",
      phone: "",
      address: "",
      notes: ""
    }
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.saved, {
    store_id: "store-b",
    membership_id: "membership-b",
    role: "owner"
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], "provision_store_owner");
  assert.equal(calls[0][2].p_payload.owner_user_id, "owner-user-1");
});

test("Day 044 migration and docs define SaaS onboarding boundary", () => {
  const migrationPath = join(root, "supabase", "migrations", "0006_store_onboarding.sql");
  const sprintDocPath = join(root, "docs", "sprints", "day044_multi_customer_onboarding_saas_reuse.md");
  const roadmapPath = join(root, "docs", "sprints", "day037_to_day046_production_roadmap.md");
  const readmePath = join(root, "docs/development-history.md");

  assert.ok(existsSync(migrationPath), "Day 044 migration is missing");
  assert.ok(existsSync(sprintDocPath), "Day 044 sprint doc is missing");

  const migration = readFileSync(migrationPath, "utf8");
  const sprintDoc = readFileSync(sprintDocPath, "utf8");
  const roadmap = readFileSync(roadmapPath, "utf8");
  const readme = readFileSync(readmePath, "utf8");

  assert.match(migration, /create table if not exists public\.store_onboarding_runs/);
  assert.match(migration, /create or replace function public\.provision_store_owner/);
  assert.match(migration, /insert into public\.stores/);
  assert.match(migration, /insert into public\.store_members/);
  assert.match(migration, /unique \(owner_user_id, store_id\)/);
  assert.match(migration, /grant execute on function public\.provision_store_owner/);
  assert.match(sprintDoc, /Day 044 Multi-Customer Onboarding and SaaS Reuse/);
  assert.match(sprintDoc, /A second store can be created without code changes/);
  assert.match(sprintDoc, /Deployment remains Day 045/);
  assert.match(roadmap, /Day 044 turns the first-store path into a repeatable customer path/);
  assert.match(readme, /Day 044 adds a repeatable multi-customer onboarding path/);
});

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
