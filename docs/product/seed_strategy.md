# Day 005 Seed Strategy

This is a local seed strategy for the paint-store inventory and billing MVP.

## Scope

- No live Supabase project is required for Day 005.
- No live Supabase credentials are used or stored.
- The seed data is synthetic and safe for local development.
- Day 006 can use this data to build the product list UI.

## Starter Data

- 20 products covering paint, primer, thinner, colorants, tools, and supplies.
- 5 customers covering contractor, homeowner, property manager, workshop, and walk-in use cases.
- 3 suppliers covering paint supply, tools, and chemicals.

## Loading Later

When a live or local Supabase database exists, run:

```sql
\i supabase/migrations/0001_initial_schema.sql
\i supabase/seed.sql
```

## Principles

- Keep the data model small.
- Support the Day 002 workflows before adding optional ERP features.
- Use documents and inventory movements as the audit trail.
- Do not add tax, multi-store, staff permission, or accounting-module data yet.
