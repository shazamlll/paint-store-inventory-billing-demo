import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("Cloudflare deployment scripts and dependencies are configured", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

  assert.equal(packageJson.scripts["cloudflare:build"], "opennextjs-cloudflare build");
  assert.equal(packageJson.scripts.preview, "npm run cloudflare:build && wrangler dev");
  assert.equal(packageJson.scripts.deploy, "wrangler deploy");
  assert.ok(packageJson.devDependencies["@opennextjs/cloudflare"]);
  assert.ok(packageJson.devDependencies.wrangler);
});

test("Wrangler keeps the portfolio snapshot detached from live domain routes", () => {
  const wrangler = readFileSync("wrangler.jsonc", "utf8");

  assert.match(wrangler, /"name":\s*"paint-store-inventory-billing-demo"/);
  assert.match(wrangler, /"compatibility_date":\s*"2026-07-01"/);
  assert.match(wrangler, /"compatibility_flags":\s*\[\s*"nodejs_compat"\s*\]/);
  assert.match(wrangler, /"workers_dev":\s*false/);
  assert.match(wrangler, /"preview_urls":\s*false/);
  assert.doesNotMatch(wrangler, /"(?:routes|account_id|zone_id)"\s*:/);
});

test("OpenNext Cloudflare config exists", () => {
  const config = readFileSync("open-next.config.ts", "utf8");

  assert.match(config, /@opennextjs\/cloudflare/);
  assert.match(config, /defineCloudflareConfig/);
});
