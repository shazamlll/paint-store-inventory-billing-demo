import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const globalsCss = readFileSync(join(root, "app", "globals.css"), "utf8");

test("global UI tokens map the app to a Figma-inspired operational surface", () => {
  assert.match(globalsCss, /--background:\s*#ffffff;/);
  assert.match(globalsCss, /--accent:\s*#000000;/);
  assert.match(globalsCss, /--accent-soft:\s*#dceeb1;/);
  assert.match(globalsCss, /--block-lilac:\s*#c5b0f4;/);
  assert.match(globalsCss, /--surface-soft:\s*#f7f7f5;/);
  assert.match(globalsCss, /--sidebar-bg:\s*#f4ecd6;/);
  assert.match(globalsCss, /font-feature-settings:\s*"kern";/);
  assert.match(globalsCss, /html\s*\{\s*font-size:\s*17px;/);
  assert.match(globalsCss, /border-radius:\s*9999px;/);
  assert.match(globalsCss, /box-shadow:\s*var\(--paper-shadow\);/);
});

test("global app shell styles provide desktop sidebar and mobile navigation", () => {
  assert.match(globalsCss, /\.app-shell/);
  assert.match(globalsCss, /\.app-sidebar/);
  assert.match(globalsCss, /\.app-nav-link-active/);
  assert.match(globalsCss, /\.app-mobile-nav/);
  assert.match(globalsCss, /grid-template-columns:\s*256px minmax\(0,\s*1fr\);/);
});

test("home hero uses a light Figma color block instead of a black header", () => {
  const homePage = readFileSync(join(root, "app", "page.js"), "utf8");

  assert.match(globalsCss, /\.commerce-hero\s*\{[^}]*background:\s*var\(--block-cream\);/s);
  assert.match(globalsCss, /\.commerce-hero\s*\{[^}]*color:\s*var\(--foreground\);/s);
  assert.match(globalsCss, /\.commerce-hero \.commerce-muted\s*\{[^}]*color:\s*var\(--foreground\);/s);
  assert.doesNotMatch(homePage, /text-white/);
});
