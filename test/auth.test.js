import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function loadAuth() {
  const modulePath = join(root, "src", "auth.js");

  assert.equal(existsSync(modulePath), true, "src/auth.js is missing");

  return import("../src/auth.js");
}

test("Day 038 validates Supabase auth environment without exposing keys", async () => {
  const { getSupabaseAuthEnvironment } = await loadAuth();
  const environment = getSupabaseAuthEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "https://demo-project.supabase.co/rest/v1",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_example"
  });

  assert.equal(environment.ready, true);
  assert.equal(environment.projectUrl, "https://demo-project.supabase.co");
  assert.equal(environment.hasAnonKey, true);
  assert.equal(environment.anonKey, undefined);
  assert.equal(environment.anonKeyPreview, "sb_publishable_...");
});

test("Day 038 signs in through Supabase Auth client and normalizes the session", async () => {
  const { signInWithSupabaseAuth } = await loadAuth();
  const calls = [];
  const result = await signInWithSupabaseAuth(
    {
      email: " Owner@Paint.Test ",
      password: "paint1234"
    },
    {
      auth: {
        async signInWithPassword(payload) {
          calls.push(payload);
          return {
            data: {
              session: {
                user: {
                  email: payload.email,
                  id: "user-1"
                }
              }
            },
            error: null
          };
        }
      }
    }
  );

  assert.deepEqual(calls, [{ email: "owner@paint.test", password: "paint1234" }]);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.session, {
    isAuthenticated: true,
    userEmail: "owner@paint.test",
    userId: "user-1"
  });
});

test("auth gate redirects every app route except login when no Supabase session exists", async () => {
  const { buildAuthGate } = await loadAuth();

  assert.deepEqual(buildAuthGate({ pathname: "/", authReady: true, session: null }), {
    allowed: false,
    reason: "missing_session",
    redirectTo: "/login"
  });
  assert.deepEqual(buildAuthGate({ pathname: "/products", authReady: true, session: null }), {
    allowed: false,
    reason: "missing_session",
    redirectTo: "/login"
  });
  assert.deepEqual(buildAuthGate({ pathname: "/login", authReady: true, session: null }), {
    allowed: true,
    reason: "public_route",
    redirectTo: null
  });
  assert.deepEqual(buildAuthGate({ pathname: "/products", authReady: true, session: { user: { id: "user-1" } } }), {
    allowed: true,
    reason: "authenticated",
    redirectTo: null
  });
});

test("protected routes start from a stable loading auth state before hydration", async () => {
  const { buildAuthGate, getInitialAuthShellState } = await loadAuth();
  const initialState = getInitialAuthShellState();

  assert.deepEqual(initialState, {
    authReady: false,
    session: null
  });
  assert.deepEqual(
    buildAuthGate({
      pathname: "/products",
      authReady: initialState.authReady,
      session: initialState.session,
      hasAuthClient: true
    }),
    {
      allowed: false,
      reason: "loading_session",
      redirectTo: null
    }
  );
});

test("Day 038 login page uses Supabase Auth and hides demo credentials", () => {
  const pagePath = join(root, "app", "login", "page.js");

  assert.equal(existsSync(pagePath), true, "app/login/page.js is missing");

  const page = readFileSync(pagePath, "utf8");

  assert.match(page, /signInWithSupabaseAuth/);
  assert.match(page, /createBrowserSupabaseClient/);
  assert.match(page, /getSession/);
  assert.match(page, /useRouter/);
  assert.match(page, /router\.replace\("\/"\)/);
  assert.doesNotMatch(page, /signInLocalDemo/);
  assert.doesNotMatch(page, /owner@paint\.test|paint123|鏈湴鏍蜂緥璐﹀彿/);
});

test("Day 038 app shell wires a consistent auth gate for operational routes", () => {
  const shellPath = join(root, "app", "AppShell.js");

  assert.equal(existsSync(shellPath), true, "app/AppShell.js is missing");

  const shell = readFileSync(shellPath, "utf8");

  assert.match(shell, /buildAuthGate/);
  assert.match(shell, /onAuthStateChange/);
  assert.match(shell, /getSession/);
  assert.match(shell, /useRouter/);
  assert.match(shell, /isLoginRoute/);
  assert.match(shell, /router\.replace\(authGate\.redirectTo\)/);
});

test("Day 038 sprint doc records auth boundary and blocked write scope", () => {
  const docPath = join(root, "docs", "sprints", "day038_production_authentication_foundation.md");

  assert.equal(existsSync(docPath), true, "Day 038 sprint doc is missing");

  const doc = readFileSync(docPath, "utf8");

  assert.match(doc, /Day 038 Production Authentication Foundation/);
  assert.match(doc, /Supabase Auth/);
  assert.match(doc, /Day 039/);
  assert.match(doc, /business writes remain blocked/i);
});
