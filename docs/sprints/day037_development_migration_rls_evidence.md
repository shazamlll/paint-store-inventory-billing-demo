---
title: "Day 037 Development Migration and RLS Evidence"
created: 2026-06-28
updated: 2026-06-28
project: paint-store-inventory-billing
stage: completed
---

# Day 037 Development Migration and RLS Evidence

## Objective

Move the development Supabase work from planned migration to recorded evidence. This sprint is not production-ready and does not enable live business writes.

## Inputs

- Migration SQL: `docs/supabase/day034_development_migration.sql`
- Read-only evidence SQL: `docs/supabase/day037_rls_evidence_checks.sql`
- Evidence helper: `src/development-rls-evidence.js`

## Required Evidence

1. `development_migration_applied`: record the development project ref and SQL execution time.
2. `catalog_rls_enabled`: verify row level security for `products`, `customers`, and `suppliers`.
3. `catalog_select_policies_present`: verify store-scoped select policies for catalog tables.
4. `anon_key_does_not_bypass_rls`: use the anon key without a signed-in user and record that RLS is not bypassed.
5. `store_member_reads_own_store`: sign in as a development store member and record own-store catalog row counts.
6. `store_member_cannot_read_other_store`: with the same member, record that another store's rows are not visible.

## Current Status

The repo has the Day037 evidence checklist and read-only SQL diagnostics.

Supabase MCP OAuth was completed on 2026-06-28. The main Codex MCP worker did not refresh the token, so the database checks were run through a fresh Codex subprocess using the configured Supabase MCP only.

The configured project URL matched the development project:

- `https://demo-project.supabase.co`

`list_migrations` returned an empty migration list. A write-path `apply_migration` attempt for `day034_development_migration` was not confirmed because the MCP mutation permission request was cancelled in the subprocess. Do not treat the migration history as complete.

Read-only diagnostics still showed that the expected schema and RLS structure already exist in the development database:

| Check | Result |
| --- | --- |
| `products` RLS | enabled |
| `customers` RLS | enabled |
| `suppliers` RLS | enabled |
| `stores` RLS | enabled |
| `store_members` RLS | enabled |
| `products` policy count | 4 |
| `customers` policy count | 4 |
| `suppliers` policy count | 4 |
| visible `products` rows in MCP context | 0 |
| visible `customers` rows in MCP context | 0 |
| visible `suppliers` rows in MCP context | 0 |
| `auth.users` count | 0 |
| `stores` count | 0 |
| `store_members` count | 0 |

After fixture creation, the development database had:

| Scope | Count |
| --- | ---: |
| Day037 auth users | 2 |
| Day037 stores | 2 |
| Day037 store memberships | 2 |
| Day037 products | 2 |
| Day037 customers | 2 |
| Day037 suppliers | 2 |

Supabase advisors were also checked:

- Security: 5 warnings.
  - 1 Function Search Path Mutable warning.
  - 2 Public Can Execute SECURITY DEFINER Function warnings.
  - 2 Signed-In Users Can Execute SECURITY DEFINER Function warnings.
- Performance: 22 informational notices.
  - 3 unindexed foreign key notices.
  - 19 unused index notices.

The first signed-in RLS test failed with `permission denied for table products`. The cause was missing PostgREST table privileges for the `authenticated` role. The migration files were updated to grant catalog SELECT privileges to `authenticated`, and the same grants were applied to the development database:

- `grant usage on schema public to authenticated`
- `grant select on public.products to authenticated`
- `grant select on public.customers to authenticated`
- `grant select on public.suppliers to authenticated`

Follow-up privilege checks reported authenticated SELECT as `true` for `products`, `customers`, and `suppliers`.

Final RLS behavior evidence:

| Actor | Result |
| --- | --- |
| anon key without session | blocked with `42501`; visible Day037 rows: 0 |
| `rls-owner-a+dev@paint-store.local` | saw 1 Day037 product in store `10000000-0000-4000-8000-000000000037` |
| `rls-owner-b+dev@paint-store.local` | saw 1 Day037 product in store `20000000-0000-4000-8000-000000000037` |

This completes the Day037 RLS behavior evidence for catalog reads. It is not production-ready and does not enable live business writes.

## Evidence Checklist Status

| Evidence item | Status | Note |
| --- | --- | --- |
| `development_migration_applied` | recorded with caveat | Schema exists and required grants were applied, but MCP migration history is empty and `apply_migration` was not confirmed. |
| `catalog_rls_enabled` | recorded | `products`, `customers`, `suppliers`, `stores`, and `store_members` report RLS enabled. |
| `catalog_select_policies_present` | recorded | `products`, `customers`, and `suppliers` each report 4 policies. |
| `anon_key_does_not_bypass_rls` | recorded | Anon key returned `42501` and 0 visible Day037 rows. |
| `store_member_reads_own_store` | recorded | Each fixture owner saw exactly 1 product in their own store. |
| `store_member_cannot_read_other_store` | recorded | Fixture owners saw only their own store UUID, not the other store. |

## Boundary

- Browser code can only use public Supabase config.
- Do not paste private database credentials into repo docs.
- Do not enable insert, update, delete, upsert, RPC, or transaction writes from the app.
- Product and customer pages may continue using local fallback until all Day037 evidence is recorded.

## Verification Commands

- `node --test test/development-rls-evidence.test.js`
- `npm test`
- `npm run build`

## Next Step

Move to Day038: production authentication foundation. Keep the migration-history gap visible, and do not enable production writes until auth, store context, audit, backups, and transaction behavior are verified.
