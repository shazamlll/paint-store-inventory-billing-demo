# Day 034 Development Supabase Dry Run

## Objective

Apply the Day 032 database foundation to a development Supabase project and keep the first-store import path in dry-run mode.

## Development Boundary

This work targets a development Supabase project only. Do not write production store data, live sales orders, or customer operational records until authentication, RLS behavior, backups, and audit expectations are verified.

The publishable key cannot run SQL migrations. It is safe for browser access only after RLS and policies are in place. SQL migration execution must happen through the Supabase Dashboard SQL Editor, Supabase CLI with database credentials, or another trusted admin channel.

## Inputs

- Project URL: `NEXT_PUBLIC_SUPABASE_URL`
- Publishable key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Migration SQL: `docs/supabase/day034_development_migration.sql`
- Dry-run source templates:
  - `docs/pilot/templates/products.csv`
  - `docs/pilot/templates/customers.csv`
  - `docs/pilot/templates/suppliers.csv`
  - `docs/pilot/templates/opening_stock.csv`
  - `docs/pilot/templates/opening_receivables.csv`

## Execution Steps

1. Open the development Supabase project.
2. Open SQL Editor.
3. Paste and run `docs/supabase/day034_development_migration.sql`.
4. Confirm the `stores` and `store_members` tables exist.
5. Confirm business tables include `store_id`.
6. Confirm RLS is enabled on `stores`, `store_members`, products, customers, suppliers, sales orders, purchase orders, payments, and inventory movements.
7. Run the Day 033 first-store import path as a dry run only.

## Current Result

The repository now has a SQL Editor-ready migration file and a development Supabase plan module. The actual SQL execution still requires an admin-capable Supabase channel; the browser publishable key is intentionally insufficient for that.
