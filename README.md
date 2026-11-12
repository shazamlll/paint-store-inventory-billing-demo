# Paint Store Inventory & Billing

A small-store inventory and billing application built with Next.js, Supabase, and Postgres, with a Cloudflare Workers deployment configuration. The core workflow connects sales and purchase documents to inventory movements and receivable/payable balances.

This is an independent, sanitized portfolio snapshot. Store identities and contacts are synthetic, environment identifiers are examples, and no running backend or hosted demo is provided. The store-facing UI is in Chinese and uses RMB formatting.

## What the project demonstrates

- **Business modeling:** product and customer catalogs, sales, purchase receiving, inventory adjustments, low-stock views, daily summaries, and printable sales bills.
- **Multi-tenant data access:** store memberships, store-scoped queries, Supabase Auth, and versioned row-level security policies.
- **Transactional writes:** Postgres RPC functions group order creation, line items, stock movements, and balance updates in a transaction.
- **Audit and corrections:** audit triggers and a constrained sales-reversal path; orders with attached payments have additional restrictions.
- **Testable domain logic:** calculations and validation live in small JavaScript modules, separate from page components and persistence.
- **Deployment configuration:** Next.js through the OpenNext Cloudflare adapter. This snapshot has no custom-domain route and disables Workers development and preview URLs.

## Architecture

```text
Next.js / React pages
        |
        +-- JavaScript domain modules (calculations, validation, formatting)
        |
        +-- Next.js API routes (user verification, store context, writes)
                       |
                       +-- Supabase Auth / PostgREST
                                      |
                                      +-- Postgres tables, RLS, transactional RPCs

Cloudflare Workers + OpenNext: optional hosting configuration
```

The browser and API client factories use the public Supabase URL and publishable/anon key. The API forwards the authenticated user's authorization header rather than using a service-role client.

## Explore the code

| Area | Entry points |
| --- | --- |
| Domain rules and persistence | [`src/`](./src/) |
| Pages and API routes | [`app/`](./app/) |
| Supabase client factories | [`lib/supabase.js`](./lib/supabase.js) |
| Database migrations | [`supabase/migrations/`](./supabase/migrations/) |
| Tests and synthetic fixtures | [`test/`](./test/) |
| Architecture and API reference | [`reference/`](./reference/) |
| Historical development notes | [`docs/development-history.md`](./docs/development-history.md), [`docs/sprints/`](./docs/sprints/) |

The historical notes describe successive stages of development. Environment values have been replaced with examples; the notes are not evidence that a public deployment is running. Some older notes have been superseded by later code.

## Run locally

Use Node.js 22 or newer; this snapshot was verified with Node.js 24.

```sh
npm ci
npm test
npm run dev
```

Tests run without Supabase credentials. Without configured credentials, the UI shows the authentication/configuration boundary; it does not bypass login to expose business pages.

To explore authenticated workflows:

1. Create your own isolated Supabase development project with synthetic data.
2. Apply the numbered files in `supabase/migrations/` in order, using your trusted database administration channel.
3. Create test Auth users and corresponding store memberships. The onboarding design is documented in [`docs/sprints/day044_multi_customer_onboarding_saas_reuse.md`](./docs/sprints/day044_multi_customer_onboarding_saas_reuse.md).
4. Copy `.env.example` to `.env.local`, fill in your project's public URL and publishable/anon key, and restart the dev server.

The legacy `supabase/seed.sql` predates store-scoped onboarding. Its sample rows need store ownership before use with the multi-tenant schema; it is not a ready-to-run tenant provisioning script.

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your own Supabase project root URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your own publishable/anon key |

Both are client-visible configuration. Do not put secret keys, service-role keys, database passwords, or Cloudflare API tokens in `NEXT_PUBLIC_*` variables or commit them to the repository. Routine application builds do not need database administration credentials.

```sh
npm run build              # Next.js build
npm run cloudflare:build   # Optional OpenNext/Workers build
```

There is no automatic deployment workflow. Hosting requires your own accounts, configuration, and security review; cloning this repository does not connect to an existing service.

## Scope and current limitations

This is an engineering portfolio project, not a production-readiness claim.

- Role-shaped navigation exists, but database and API authorization need further hardening to consistently enforce owner, clerk, and accountant permissions.
- Tests cover domain behavior, mocks, and source/schema contracts. They do not establish live-database isolation, deployed security, or full end-to-end correctness.
- Standalone payment collection, allocation, and payment reversal remain incomplete.
- Backups, restore drills, monitoring, operational rate limits, and commercial rollout checks still need work.
- Reproducing authenticated workflows requires your own Supabase setup; no shared credentials or production data are supplied.

No open-source reuse license has been selected for this portfolio snapshot.
