---
title: "Day 045 Deployment Discussion - Cloudflare Lite"
created: 2026-07-01
project: paint-store-inventory-billing
stage: decision-record
---

# Day 045 Deployment Discussion - Cloudflare Lite

## Context

The original Day 045 scope assumed a formal external pilot and production-readiness gate. The current decision changes that assumption:

- The first real user will be the project owner.
- The project owner accepts the risk of using an early production deployment.
- The goal is to make the app personally usable first, not to prepare a broad external pilot.
- Payment entry can remain deferred.
- Commercial multi-customer hardening can follow after the app is live for the owner.

## Platform Discussion

Cloudflare and Vercel overlap, but they are not identical products.

- Cloudflare is broader internet infrastructure: DNS, CDN, security, Workers, Pages, routing, and custom domains.
- Vercel is primarily an application deployment platform, especially smooth for Next.js.
- Both can deploy web apps and bind domains.
- Vercel has the simplest Next.js path.
- Cloudflare Workers can run full-stack Next.js through the OpenNext Cloudflare adapter, but it adds deployment adapter and Wrangler configuration work.

## Current Decision

Use Cloudflare for the application host and domain layer, while keeping Supabase for data and authentication.

```text
Application hosting: Cloudflare Workers
Domain / DNS: Cloudflare
Database / Auth / RLS: Supabase
Source control: GitHub
Primary app domain: app.<domain>
Environment count: one owner-production environment first
```

This is a "Cloudflare-only" infrastructure decision for the server/domain side. It is not a full backend migration to Cloudflare D1, KV, Access, or Durable Objects.

## Explicit Non-Goals

- Do not migrate Supabase Auth, RLS, SQL functions, or migrations to Cloudflare-native storage.
- Do not build a full external pilot environment matrix yet.
- Do not add payment workflow scope to Day 045.
- Do not create a complex multi-customer commercial deployment gate in this sprint.

## Day 045 Lite Scope

- Add Cloudflare Workers deployment design for the existing Next.js app.
- Add OpenNext/Wrangler deployment configuration if implementation proceeds.
- Document required Cloudflare settings without exposing secrets.
- Document required Supabase production settings without exposing secrets.
- Define `app.<domain>` as the first application entry point.
- Define a minimal owner-production smoke test.
- Document rollback to the previous Worker deployment.

## Risk Acceptance

The owner accepts that this simplified path may miss some external-pilot controls:

- limited monitoring;
- limited formal backup verification;
- limited multi-environment separation;
- limited support/admin tooling;
- no formal customer SLA.

These become Day 046 or post-owner-production hardening items.

## Open Inputs Needed

- Final domain name: `example.com`.
- Primary app domain: `app.example.com`.
- Cloudflare account access: confirmed; the dashboard can see the GitHub repository.
- Supabase project choice for owner production: `demo-inventory-billing`.
- GitHub repository: `https://github.com/shazamlll/paint-store-inventory-billing-demo`.
- Deployment starts from GitHub-based Workers creation after repository configuration lands.

## Confirmed Supabase Settings

- Project URL source: Supabase Data API URL, with `/rest/v1/` removed before using it as `NEXT_PUBLIC_SUPABASE_URL`.
- Publishable key source: Supabase anon public key.
- Auth Site URL: `https://app.example.com`.
- Auth Redirect URLs:
  - `https://app.example.com/**`
  - `http://localhost:3000/**`
- Required public Worker environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Do not add service-role keys, direct database URLs, or migration/admin credentials to Cloudflare Worker public or secret variables.

## Confirmed Database State

- Existing base tables include products, customers, suppliers, sales orders, purchase orders, payments, inventory movements, stores, and store members.
- `stores` has data.
- `store_members` has data.
- Day 043 migration `0005_audit_correction_foundation.sql` was applied successfully.
- Day 044 migration `0006_store_onboarding.sql` was applied successfully.

## Cloudflare Build Settings

The repository now carries a Cloudflare Workers deployment path using OpenNext.

Use these settings when creating the Worker from GitHub:

```text
Repository: shazamlll/paint-store-inventory-billing-demo
Branch: main
Build command: npm run cloudflare:build
Deploy command: npm run deploy
Environment variables:
  NEXT_PUBLIC_SUPABASE_URL=<Supabase project root URL, no /rest/v1/>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
Custom domain: app.example.com
```

The repository also keeps a local preview path:

```powershell
npm run preview
```

and a manual deployment path after a successful Cloudflare build:

```powershell
npm run cloudflare:build
npm run deploy
```

Rollback should use Cloudflare's previous Worker deployment if the owner-production smoke test fails.

## Current Recommendation

Proceed with Day 045 as `Cloudflare Workers + Supabase owner-production deployment`.

Keep the implementation reversible: document Vercel as an alternative, but do not make Vercel the default path for this sprint.
