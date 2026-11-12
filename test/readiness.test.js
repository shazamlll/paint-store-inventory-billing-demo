import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("readiness demo route and navigation are removed", () => {
  const readinessPath = join(root, "app", "readiness", "page.js");
  const uxCopy = readFileSync(join(root, "src", "ux-copy.js"), "utf8");

  assert.equal(existsSync(readinessPath), false, "readiness page route should be removed");
  assert.equal(homeCopy.navItems.some((item) => item.href === "/readiness"), false);
  assert.doesNotMatch(uxCopy, /readinessCopy|上线边界|Day 030/);
});
