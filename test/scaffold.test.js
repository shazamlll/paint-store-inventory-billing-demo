import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { appNavigation } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

test("Day 004 package scripts support local Next app development", () => {
  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts.start, "next start");
  assert.equal(packageJson.scripts.test, "node --test");
});

test("Day 004 dependencies include Next, React, Supabase client, and Tailwind toolchain", () => {
  for (const dependency of ["next", "react", "react-dom", "@supabase/supabase-js"]) {
    assert.ok(packageJson.dependencies?.[dependency], `${dependency} dependency is missing`);
  }

  for (const dependency of ["tailwindcss", "postcss", "autoprefixer"]) {
    assert.ok(packageJson.devDependencies?.[dependency], `${dependency} dev dependency is missing`);
  }
});

test("Day 004 scaffold creates the expected app foundation files", () => {
  for (const path of [
    "app/layout.js",
    "app/page.js",
    "app/globals.css",
    "lib/supabase.js",
    "next.config.js",
    "postcss.config.js",
    "tailwind.config.js"
  ]) {
    assert.ok(existsSync(join(root, path)), `${path} is missing`);
  }
});

test("root layout wraps pages in the global app shell", () => {
  const layout = readFileSync(join(root, "app/layout.js"), "utf8");
  assert.match(layout, /import AppShell from "\.\/AppShell"/);
  assert.match(layout, /<AppShell>\{children\}<\/AppShell>/);
});

test("app shell renders grouped sidebar navigation with active route support", () => {
  const shell = readFileSync(join(root, "app/AppShell.js"), "utf8");
  assert.match(shell, /"use client"/);
  assert.match(shell, /usePathname/);
  assert.match(shell, /appNavigation\.groups/);
  assert.match(shell, /app-sidebar/);
  assert.match(shell, /aria-current/);
});

test("global app navigation keeps customer list reachable from the menu", () => {
  const menuHrefs = appNavigation.groups.flatMap((group) =>
    group.items.map((item) => item.href)
  );

  assert.ok(menuHrefs.includes("/customers"));
});

test("home page is an authenticated app entry and avoids demo artifacts", () => {
  const page = readFileSync(join(root, "app/page.js"), "utf8");
  assert.match(page, /homeCopy/);
  assert.doesNotMatch(page, /homeCopy\.navItems/);
  assert.doesNotMatch(page, /day003Tables|day002CoreFlows|sampleSummary/);
  assert.doesNotMatch(page, /<Link/);
  assert.doesNotMatch(page, /create table/i);
});
