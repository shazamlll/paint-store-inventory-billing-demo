import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  appNavigation,
  formatPaymentStatusLabel,
  formatVerificationStatusLabel,
  homeCopy
} from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("homepage copy no longer exposes sprint or demo markers", () => {
  assert.equal(homeCopy.dayMarker, undefined);
  assert.equal(homeCopy.navItems.find((item) => item.href === "/dashboard").label, "经营看板");
  assert.equal(homeCopy.navItems.find((item) => item.href === "/sales").label, "开销售单");
  assert.equal(homeCopy.navItems.some((item) => item.href.startsWith("/demo")), false);
  assert.equal(homeCopy.navItems.some((item) => item.href === "/pitch"), false);
  assert.equal(homeCopy.navItems.some((item) => item.href === "/readiness"), false);
  assert.equal(homeCopy.sampleDataSection, undefined);
});

test("global app navigation groups daily operations and inventory work", () => {
  assert.equal(appNavigation.groups.length, 2);

  const daily = appNavigation.groups.find((group) => group.id === "daily-operations");
  const inventory = appNavigation.groups.find((group) => group.id === "catalog-inventory");

  assert.deepEqual(daily.items.map((item) => item.href), [
    "/dashboard",
    "/sales",
    "/sales/print",
    "/purchases",
    "/reports/daily",
    "/search"
  ]);
  assert.deepEqual(inventory.items.map((item) => item.href), [
    "/products",
    "/customers",
    "/inventory",
    "/inventory/low-stock",
    "/inventory/adjustments"
  ]);
  assert.equal(appNavigation.groups.some((group) => group.items.some((item) => item.href === "/login")), false);
  assert.equal(daily.items.find((item) => item.href === "/sales").exact, true);
  assert.equal(daily.items.find((item) => item.href === "/sales/print").exact, true);
  assert.doesNotMatch(appNavigation.status, /样例|demo|Day|上线边界/i);
});

test("Day 027 formats payment and verification statuses for owners", () => {
  assert.equal(formatPaymentStatusLabel("paid"), "已收清");
  assert.equal(formatPaymentStatusLabel("partial"), "部分收款");
  assert.equal(formatPaymentStatusLabel("unpaid"), "未收款");
  assert.equal(formatPaymentStatusLabel("unknown"), "待确认");
  assert.equal(formatVerificationStatusLabel("ok"), "已核对");
  assert.equal(formatVerificationStatusLabel("review"), "需复核");
  assert.equal(formatVerificationStatusLabel("unknown"), "待核对");
});

test("homepage source does not render demo walkthrough sections", () => {
  const homePage = readFileSync(join(root, "app", "page.js"), "utf8");
  const appShell = readFileSync(join(root, "app", "AppShell.js"), "utf8");

  for (const phrase of ["homeCopy"]) {
    assert.match(homePage, new RegExp(phrase));
  }

  assert.doesNotMatch(homePage, /homeCopy\.dayMarker/);
  assert.doesNotMatch(homePage, /sampleSummary|day002CoreFlows|day003Tables/);
  assert.match(appShell, /appNavigation/);
  assert.match(appShell, /appNavigation\.groups/);
});

test("Day 027 is documented", () => {
  const sprintPath = join(root, "docs", "sprints", "day027_ux_copy_polish.md");

  assert.ok(existsSync(sprintPath), "Day 027 sprint doc is missing");
  assert.match(readFileSync(sprintPath, "utf8"), /UX copy polish/i);
});
