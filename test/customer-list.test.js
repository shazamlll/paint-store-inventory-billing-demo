import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  appendCustomer,
  createCustomerDraft,
  getCustomerSummary,
  normalizeCustomerDraft,
  validateCustomerDraft
} from "../src/customers.js";
import { seedCustomers } from "./fixtures/catalog.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Day 008 exposes the expanded seeded customers for local UI work", () => {
  assert.ok(seedCustomers.length >= 8);
  assert.deepEqual(Object.keys(seedCustomers[0]), [
    "name",
    "phone",
    "notes",
    "receivableBalance"
  ]);
  assert.ok(seedCustomers.some((customer) => customer.name === "散客"));
});

test("Day 008 customer summary supports receivables scanning", () => {
  const summary = getCustomerSummary([
    ...seedCustomers,
    {
      name: "Credit Painter",
      phone: "555-0199",
      notes: "Pays weekly",
      receivableBalance: 125.5
    }
  ]);

  assert.equal(summary.totalCustomers, seedCustomers.length + 1);
  assert.ok(summary.receivableCustomerCount >= 1);
  assert.ok(summary.totalReceivableBalance >= 125.5);
  assert.equal(summary.walkInCustomerName, "散客");
});

test("Day 008 creates and validates add-customer drafts", () => {
  assert.deepEqual(createCustomerDraft(), {
    name: "",
    phone: "",
    notes: "",
    receivableBalance: "0"
  });

  assert.deepEqual(
    validateCustomerDraft({
      name: "",
      phone: "",
      notes: "",
      receivableBalance: "-1"
    }),
    {
      name: "客户名称不能为空。",
      receivableBalance: "应收余额不能小于 0。"
    }
  );
});

test("Day 008 normalizes and appends a customer without mutating the original list", () => {
  const original = seedCustomers.slice(0, 2);
  const customer = normalizeCustomerDraft({
    name: "  Apartment Painter  ",
    phone: " 555-0188 ",
    notes: "  Calls before pickup ",
    receivableBalance: "42.25"
  });
  const appended = appendCustomer(original, customer);

  assert.deepEqual(customer, {
    name: "Apartment Painter",
    phone: "555-0188",
    notes: "Calls before pickup",
    receivableBalance: 42.25
  });
  assert.equal(original.length, 2);
  assert.equal(appended.length, 3);
  assert.equal(appended[2].name, "Apartment Painter");
});

test("empty Supabase customer catalog is ready for the first customer write", async () => {
  const { isWritableCatalogReadSource } = await import("../src/catalog-readiness.js");

  assert.equal(isWritableCatalogReadSource("supabase"), true);
  assert.equal(isWritableCatalogReadSource("supabase_empty"), true);
  assert.equal(isWritableCatalogReadSource("loading"), false);
  assert.equal(isWritableCatalogReadSource("supabase_error"), false);
  assert.equal(isWritableCatalogReadSource("supabase_unavailable"), false);
});

test("Day 008 creates a customer list route without direct browser Supabase writes", () => {
  const pagePath = join(root, "app", "customers", "page.js");
  const clientPath = join(root, "app", "customers", "CustomerListClient.js");

  assert.ok(existsSync(pagePath), "app/customers/page.js is missing");
  assert.ok(existsSync(clientPath), "CustomerListClient.js is missing");

  const page = readFileSync(pagePath, "utf8");
  const client = readFileSync(clientPath, "utf8");

  assert.match(page, /CustomerListClient/);
  assert.match(page, /useDatabasePageData/);
  assert.match(page, /initialCustomers/);
  assert.match(page, /onSaved/);
  assert.match(client, /useState/);
  assert.match(client, /initialCustomers = \[\]/);
  assert.match(client, /\/api\/catalog\/customers/);
  assert.match(client, /删除/);
  assert.match(client, /method:\s*"DELETE"/);
  assert.match(client, /isWritableCatalogReadSource/);
  assert.doesNotMatch(client, /readSource !== "supabase"/);
  assert.doesNotMatch(client, /appendCustomer/);
  assert.doesNotMatch(`${page}\n${client}`, /\.from\(|\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
});

test("home page links to the customer list route", () => {
  assert.ok(homeCopy.navItems.some((item) => item.href === "/customers"));
});
