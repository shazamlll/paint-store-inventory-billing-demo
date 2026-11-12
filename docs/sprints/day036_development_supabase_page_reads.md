# Day 036 Development Supabase Page Reads

## Objective

Use the verified development Supabase migration and RLS foundation to let catalog pages attempt real read-only Supabase reads before falling back to local sample data.

## Scope

- `/products` reads the development `products` table first.
- `/customers` reads the development `customers` table first.
- Empty or failed Supabase reads fall back to local sample data so the existing owner walkthrough remains usable.
- The customer add form remains page-local only.
- No insert, update, delete, upsert, RPC, production write, or live sales order write is enabled.

## Guardrails

- Pages are server-rendered with `dynamic = "force-dynamic"` so development environment variables are read at request time.
- Browser code never receives `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `SUPABASE_DB_URL`.
- Supabase read mapping lives in `src/development-page-reads.js` instead of the UI components.
- Current development tables may be empty until first-store import data is approved; empty remote tables are not treated as an error.

## Verification

- `node --test test/development-page-reads.test.js`
- `npm test`

## Next Step

Seed or import approved first-store catalog records into the development Supabase project, then revisit whether `/products` and `/customers` should stop using local fallback for pilot review sessions.
