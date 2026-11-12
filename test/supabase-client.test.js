import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("browser Supabase client reads public env vars with direct Next.js references", () => {
  const source = readFileSync(join(root, "lib", "supabase.js"), "utf8");

  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(source, /readEnvValue\(process\.env,\s*"NEXT_PUBLIC_SUPABASE_URL"\)/);
  assert.doesNotMatch(source, /readEnvValue\(process\.env,\s*"NEXT_PUBLIC_SUPABASE_ANON_KEY"\)/);
});
