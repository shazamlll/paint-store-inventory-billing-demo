import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("end-to-end demo runtime module and route are removed from production app", () => {
  assert.equal(existsSync(join(root, "src", "end-to-end-demo.js")), false);
  assert.equal(existsSync(join(root, "app", "demo", "page.js")), false);
});

test("Day 026 docs remain as historical notes only", () => {
  const homePage = readFileSync(join(root, "app", "page.js"), "utf8");
  const appShell = readFileSync(join(root, "app", "AppShell.js"), "utf8");
  const sprintPath = join(root, "docs", "sprints", "day026_end_to_end_demo.md");

  assert.ok(existsSync(sprintPath), "Day 026 sprint doc is missing");
  assert.match(readFileSync(sprintPath, "utf8"), /end-to-end demo/i);
  assert.match(homePage, /homeCopy/);
  assert.match(appShell, /appNavigation/);
  assert.match(appShell, /app-nav-link-active/);
});
