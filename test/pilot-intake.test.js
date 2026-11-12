import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function csvHeaders(relativePath) {
  return read(relativePath).split(/\r?\n/)[0].split(",");
}

async function loadPilotIntake() {
  const modulePath = join(root, "src", "pilot-intake.js");

  assert.equal(existsSync(modulePath), true, "src/pilot-intake.js is missing");

  return import("../src/pilot-intake.js");
}

test("Day 031 defines pilot intake sections for the first real store", async () => {
  const { pilotIntakeSections } = await loadPilotIntake();
  const sectionIds = pilotIntakeSections.map((section) => section.id);

  assert.deepEqual(sectionIds, [
    "store_profile",
    "products",
    "customers",
    "suppliers",
    "sales_bill",
    "daily_closeout",
    "first_week_boundary"
  ]);

  for (const section of pilotIntakeSections) {
    assert.ok(section.title);
    assert.ok(section.why);
    assert.ok(section.questions.length >= 3, `${section.id} needs at least three questions`);
  }
});

test("Day 031 import templates cover setup data with stable CSV headers", async () => {
  const { pilotImportTemplates } = await loadPilotIntake();
  const templates = Object.fromEntries(
    pilotImportTemplates.map((template) => [template.id, template])
  );

  assert.deepEqual(templates.products.headers, [
    "name",
    "spec",
    "unit",
    "cost_price",
    "sale_price",
    "current_stock",
    "low_stock_threshold",
    "category",
    "notes"
  ]);
  assert.deepEqual(templates.customers.headers, [
    "name",
    "phone",
    "notes",
    "opening_receivable_balance"
  ]);
  assert.deepEqual(templates.suppliers.headers, [
    "name",
    "phone",
    "notes",
    "opening_payable_balance"
  ]);
  assert.deepEqual(templates.opening_stock.headers, [
    "product_name",
    "spec",
    "unit",
    "quantity",
    "source_note"
  ]);
  assert.deepEqual(templates.opening_receivables.headers, [
    "customer_name",
    "phone",
    "amount",
    "reason",
    "due_note"
  ]);
});

test("Day 031 delivery gates block database wiring until intake is complete", async () => {
  const { pilotDeliveryGates } = await loadPilotIntake();

  assert.ok(pilotDeliveryGates.some((gate) => gate.id === "confirm_import_shape"));
  assert.ok(pilotDeliveryGates.some((gate) => gate.id === "choose_import_method"));
  assert.ok(pilotDeliveryGates.some((gate) => gate.id === "defer_persistence_until_fields_confirmed"));
  assert.ok(pilotDeliveryGates.some((gate) => gate.id === "require_security_before_live_use"));

  for (const gate of pilotDeliveryGates) {
    assert.match(gate.status, /blocked|required/);
    assert.ok(gate.reason.length >= 10);
  }
});

test("Day 031 docs and CSV templates exist for pilot handoff", async () => {
  const { pilotImportTemplates } = await loadPilotIntake();
  const doc = read("docs/pilot/day031_pilot_intake.md");

  assert.match(doc, /Day 031 Pilot Intake/);
  assert.match(doc, /真实试点/);
  assert.match(doc, /不要接真实生产数据/);
  assert.match(doc, /products\.csv/);
  assert.match(doc, /opening_receivables\.csv/);

  for (const template of pilotImportTemplates) {
    const relativePath = `docs/pilot/templates/${template.fileName}`;

    assert.equal(existsSync(join(root, relativePath)), true, `${relativePath} is missing`);
    assert.deepEqual(csvHeaders(relativePath), template.headers);
  }
});
