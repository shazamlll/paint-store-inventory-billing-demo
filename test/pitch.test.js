import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("one-page pitch demo route and navigation are removed", () => {
  const pitchPath = join(root, "app", "pitch", "page.js");
  const uxCopy = readFileSync(join(root, "src", "ux-copy.js"), "utf8");

  assert.equal(existsSync(pitchPath), false, "pitch page route should be removed");
  assert.equal(homeCopy.navItems.some((item) => item.href === "/pitch"), false);
  assert.doesNotMatch(uxCopy, /pitchCopy|一页介绍|Day 028/);
});
