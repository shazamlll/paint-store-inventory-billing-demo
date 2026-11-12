import test from "node:test";
import assert from "node:assert/strict";

import { day002CoreFlows, findCoreFlow } from "../src/core-flows.js";

test("Day 002 maps the three MVP core flows in build order", () => {
  assert.deepEqual(
    day002CoreFlows.map((flow) => flow.id),
    ["sales_billing", "purchase_receiving", "payment_tracking"]
  );
});

test("each core flow defines actor, trigger, steps, data effects, and completion signal", () => {
  for (const flow of day002CoreFlows) {
    assert.ok(flow.actor.length > 0, `${flow.id} actor is missing`);
    assert.ok(flow.trigger.length >= 20, `${flow.id} trigger is too thin`);
    assert.ok(flow.steps.length >= 4, `${flow.id} needs at least 4 concrete steps`);
    assert.ok(flow.dataEffects.length >= 3, `${flow.id} needs at least 3 data effects`);
    assert.ok(flow.completionSignal.length >= 20, `${flow.id} completion signal is too thin`);
  }
});

test("sales billing is the primary workflow and drives stock, payment, and receivables", () => {
  const flow = findCoreFlow("sales_billing");

  assert.equal(flow.priority, 1);
  assert.equal(flow.primaryDocument, "sales_order");
  assert.deepEqual(flow.dataEffects, [
    "create sales_order",
    "create sales_order_items",
    "create inventory_movements for stock deduction",
    "create or update payment record",
    "increase customer receivable when unpaid or partially paid"
  ]);
});

test("purchase receiving increases stock and preserves supplier payment state", () => {
  const flow = findCoreFlow("purchase_receiving");

  assert.equal(flow.primaryDocument, "purchase_order");
  assert.ok(flow.dataEffects.includes("create inventory_movements for stock receiving"));
  assert.ok(flow.dataEffects.includes("record supplier payment status"));
});

test("payment tracking can settle existing customer receivables without changing stock", () => {
  const flow = findCoreFlow("payment_tracking");

  assert.equal(flow.primaryDocument, "payment");
  assert.ok(flow.dataEffects.includes("reduce customer receivable balance"));
  assert.ok(flow.dataEffects.includes("link payment to one or more sales orders"));
  assert.equal(flow.affectsStock, false);
});

test("findCoreFlow fails clearly for an unknown flow id", () => {
  assert.throws(
    () => findCoreFlow("inventory_forecast"),
    /Unknown core flow: inventory_forecast/
  );
});
