import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createLoginDraft,
  getLoginSessionSummary,
  validateLoginDraft
} from "../src/login.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Day 024 creates and validates a small single-store login draft", () => {
  const draft = createLoginDraft({ storeName: "北城涂料店" });

  assert.deepEqual(draft, {
    storeName: "北城涂料店",
    email: "",
    password: "",
    rememberDevice: false
  });
  assert.deepEqual(validateLoginDraft(draft), {
    email: "请输入邮箱。",
    password: "请输入密码。"
  });
  assert.deepEqual(validateLoginDraft({ ...draft, email: "owner", password: "123" }), {
    email: "请输入有效邮箱。",
    password: "密码至少需要 6 位。"
  });
});

test("Day 024 summarizes signed-in and locked states", () => {
  assert.equal(getLoginSessionSummary(null), "已锁定：请先使用 Supabase Auth 登录。");
  assert.equal(
    getLoginSessionSummary({
      isAuthenticated: true,
      storeName: "北城涂料店",
      userEmail: "owner@paint.test",
      roleLabel: "门店店主",
      rememberDevice: true
    }),
    "已以门店店主身份登录 北城涂料店。"
  );
});

test("Day 024 production login route uses Supabase Auth only", () => {
  const pagePath = join(root, "app", "login", "page.js");

  assert.ok(existsSync(pagePath), "app/login/page.js is missing");

  const page = readFileSync(pagePath, "utf8");

  assert.doesNotMatch(readFileSync(join(root, "src", "login.js"), "utf8"), /signInLocalDemo|owner@paint\.test|paint123/);
  assert.match(page, /signInWithSupabaseAuth/);
  assert.match(page, /Supabase Auth/);
  assert.match(page, /登录/);
  assert.doesNotMatch(page, /signInLocalDemo|owner@paint\.test|paint123|本地样例账号/);
});

test("home page keeps login out of the authenticated navigation", () => {
  assert.equal(homeCopy.navItems.some((item) => item.href === "/login"), false);
});
