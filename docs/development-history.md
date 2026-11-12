> Historical development notes. Deployment details have been replaced with examples. These notes do not describe a running public service.

# Paint Store Inventory Billing

Independent repository for the paint-store inventory and billing micro SaaS.

## Project Rule

This repository is separate from the Lucas project. It targets small paint and paint-supply stores and starts with a billing-driven workflow: sales bills, purchase receiving, payments, and stock adjustments drive inventory and receivables.

## Current Status

The 30-day local MVP sprint is complete and has been productized for pilot preparation:

- Owner-facing UI uses Chinese operational copy.
- Local sample data is Chinese and remains available for development and walkthroughs.
- Money display uses RMB formatting (`¥`), not USD.
- Demo-specific routes and navigation have been removed from the product surface.
- `/login` is the only public product route; unauthenticated app routes redirect to login before showing business pages.

The app is still local-first for standalone payments, backups, and deployment. Day 038 added Supabase Auth, Day 039 added store context and role-shaped navigation, Day 040 adds a development catalog persistence path for products, customers, and suppliers through server-side API routes with server-controlled `store_id`, Day 041 adds a server-side sales order transaction path for sales orders, line items, payment state, receivables, stock deduction, and inventory movements, and Day 042 adds a server-side purchase receiving transaction path for purchase orders, line items, supplier payable state, stock increase, and inventory movements. Day 043 is adjusted to audit logs, correction rules, and receivable foundation; the standalone customer payment workflow is intentionally deferred. Day 044 adds a repeatable multi-customer onboarding path for creating another store and owner membership without code changes. Day 045 is now scoped as a simplified owner-production deployment discussion around Cloudflare Workers plus Supabase, not a full external-pilot rollout. Real commercial use remains blocked until backups, deployment gates, and hardening are verified.

## Next Action

Follow the Day 037-046 production roadmap in `docs/sprints/day037_to_day046_production_roadmap.md`. The immediate next sprint is Day 045: Cloudflare Workers plus Supabase owner-production deployment design after confirming the domain and Cloudflare/Supabase account ownership:

- final domain name and desired app subdomain;
- Cloudflare account access and DNS ownership;
- Supabase project choice for owner production;
- Wrangler/local deploy versus GitHub-based deploy preference;
- production gate items for persistence, auth, RLS, backup, and audit logs.

After multi-customer onboarding, continue through simplified deployment/domain design and owner-production hardening. Defer standalone customer payment entry until the collection workflow is confirmed by real owner usage. Do not sell this as a commercial multi-customer product until auth, RLS behavior, transaction behavior, backup, monitoring, and audit expectations are verified.

## Historical Sprint Start

### Day 001 Focus

Day 001 defines three realistic user scenes:

- owner daily control
- clerk fast billing
- receivables tracking

### Day 002 Focus

Day 002 maps the three MVP core flows:

- sales billing
- purchase receiving
- payment tracking

### Day 003 Focus

Day 003 derives the MVP data model from the core flows:

- 9 tables
- document headers and line items
- payment records
- inventory movement audit trail

Run verification:

```powershell
npm test
```
