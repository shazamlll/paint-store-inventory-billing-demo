import test from "node:test";
import assert from "node:assert/strict";

import { day001UserScenes } from "../src/scenarios.js";

test("Day 001 defines exactly three role-specific user scenes", () => {
  assert.equal(day001UserScenes.length, 3);
  assert.deepEqual(
    day001UserScenes.map((scene) => scene.role),
    ["owner", "clerk", "receivables"]
  );
});

test("each user scene states pain, trigger, workflow, and acceptance signal", () => {
  for (const scene of day001UserScenes) {
    assert.ok(scene.title.length >= 8, `${scene.role} title is too thin`);
    assert.ok(scene.pain.length >= 20, `${scene.role} pain is too thin`);
    assert.ok(scene.trigger.length >= 20, `${scene.role} trigger is too thin`);
    assert.ok(scene.workflow.length >= 3, `${scene.role} workflow needs at least 3 steps`);
    assert.ok(scene.acceptanceSignal.length >= 20, `${scene.role} acceptance signal is too thin`);
  }
});

test("scenes preserve the MVP thesis of billing-driven inventory and receivables", () => {
  const combined = day001UserScenes
    .flatMap((scene) => [
      scene.title,
      scene.pain,
      scene.trigger,
      scene.workflow.join(" "),
      scene.acceptanceSignal
    ])
    .join(" ")
    .toLowerCase();

  for (const keyword of ["销售单", "库存", "应收", "收款"]) {
    assert.match(combined, new RegExp(keyword));
  }
});
