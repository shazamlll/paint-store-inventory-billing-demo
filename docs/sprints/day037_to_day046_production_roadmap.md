---
title: "Day 037-046 Production Roadmap"
created: 2026-06-28
updated: 2026-07-01
project: paint-store-inventory-billing
stage: planned
---

# Day 037-046 Production Roadmap

## Objective

Turn the current local-first paint-store MVP into a development-pilot-ready product, then into a reusable multi-customer SaaS path.

This roadmap follows the current boundary:

- Current pages prove local workflows and selected development Supabase reads.
- Real business writes are still blocked.
- Login is still a local demo, not production authentication.
- Server, domain, and production deployment should enter design after the data and auth boundaries are defined, but before external pilot use.

## Delivery Principles

- Keep every sprint independently testable.
- Do not enable production writes until auth, RLS, transaction behavior, audit logging, and backup expectations are verified.
- Preserve local fallback only where it is explicitly useful for demo or development; do not let fallback hide production data failures.
- Treat multi-customer reuse as a product requirement, not a later cleanup.
- Prefer one real store pilot path before broad SaaS packaging.

## Sprint Sequence

### Day 037: Development Migration and RLS Evidence

**Goal:** Apply `docs/supabase/day034_development_migration.sql` to a development Supabase project and record verifiable RLS behavior.

**Scope:**

- Run the Day 034 SQL in the development Supabase SQL Editor or another admin-capable channel.
- Verify that the publishable key cannot bypass RLS.
- Verify that a store member can read only their own store rows.
- Record which development project, tables, policies, and test rows were checked without exposing secrets.

**Exit Criteria:**

- Development schema exists.
- RLS is enabled and verified for catalog tables.
- A new sprint doc records the verification evidence and remaining gaps.
- Product and customer pages can be reviewed against real development rows.

### Day 038: Production Authentication Foundation

**Goal:** Replace the local demo login boundary with a real authentication design and first Supabase Auth integration.

**Scope:**

- Decide account model for owner, clerk, and future finance/admin roles.
- Add real sign-in, sign-out, session loading, and protected page behavior.
- Remove visible demo credentials from the production path.
- Keep tests proving unauthenticated users cannot reach operational pages.

**Exit Criteria:**

- Login uses real auth in development.
- Session state is loaded from the auth provider.
- Operational routes have a consistent auth gate.
- The old local demo login is either removed or explicitly isolated as development-only.

### Day 039: Store Context and Role Authorization

**Goal:** Make every request operate inside a verified store context.

**Scope:**

- Load the current user's store membership after login.
- Define owner and clerk permissions for catalog, sales, purchases, inventory, reports, and settings.
- Add server-side authorization helpers that do not trust client-only state.
- Keep UI navigation consistent with the user's role where practical.

**Exit Criteria:**

- The app can determine the active store for the authenticated user.
- Permission checks exist outside UI components.
- Tests cover allowed and blocked access for at least owner and clerk roles.

### Day 040: Catalog Persistence and Import Path

**Goal:** Move products, customers, and suppliers from local-only management to verified development Supabase persistence.

**Scope:**

- Wire catalog create/update flows through server-side actions or API handlers.
- Keep `store_id` assignment server-controlled.
- Import approved first-store products, customers, suppliers, opening stock, and opening receivables from the Day 031 templates.
- Define how local fallback is disabled or surfaced when production data is expected.

**Exit Criteria:**

- Product/customer/supplier catalog data can be created or updated in the development database.
- Imported rows are scoped to one store.
- Tests prove writes do not cross stores.

### Day 041: Sales Order Write Transaction

**Goal:** Persist sales orders, line items, payment state, receivables, and stock deduction as one consistent transaction.

**Scope:**

- Move sales save from local state into a server-side database transaction.
- Validate product availability, quantities, discounts, and payment amount server-side.
- Create sales order header and line items.
- Deduct inventory and create inventory movement rows.
- Preserve printable sales detail behavior from persisted data.

**Exit Criteria:**

- A saved sales order survives reload.
- Stock deduction and inventory movement are consistent.
- Invalid or cross-store product references are rejected.
- Tests cover success, insufficient stock, and invalid payment cases.

### Day 042: Purchase Receiving Write Transaction

**Goal:** Persist purchase receiving, supplier payable state, stock increase, and inventory movements.

**Scope:**

- Move purchase save from local state into a server-side database transaction.
- Validate supplier, product, quantity, unit cost, and payment amount server-side.
- Create purchase order header and line items.
- Increase inventory and create purchase inventory movement rows.
- Keep supplier payable impact queryable for later reports.

**Exit Criteria:**

- A saved purchase order survives reload.
- Stock increase and inventory movement are consistent.
- Invalid cross-store supplier or product references are rejected.
- Tests cover success, invalid cost/quantity, and blocked cross-store access.

### Day 043: Audit Logs, Correction Rules, and Receivable Foundation

**Goal:** Make the first write transactions production-defensible before adding the full standalone payment workflow.

**Scope:**

- Add audit log rows for create/update/delete/reversal-sensitive operations.
- Remove destructive delete policies from key transactional tables.
- Define correction behavior for sales, purchases, inventory adjustments, and payments.
- Add a first sales-order reversal path for orders without attached payment records.
- Keep sales receivables queryable from persisted orders and customer balances.
- Standalone customer payment entry is deferred until after the audit and correction foundation is stable.

**Exit Criteria:**

- Sales receivables remain queryable from persisted orders and customer balances.
- Audit logs capture actor, store, operation, target, and timestamp.
- Correction behavior is documented and tested for sales orders and deferred standalone payments.
- Payment reversal remains an explicit dependency for the future customer payment workflow.

### Day 044: Multi-Customer Onboarding and SaaS Reuse

**Goal:** Turn the single-store pilot path into a repeatable customer onboarding flow.

**Scope:**

- Define tenant/store creation steps for a new customer.
- Create owner account provisioning flow.
- Add initial setup checklist for each store.
- Document import, verification, and handoff steps.
- Decide minimum admin tooling for support and customer activation.

**Exit Criteria:**

- A second store can be created without code changes.
- Store data remains isolated.
- Onboarding steps are documented enough for repeat use.
- Support/admin needs are captured before broad sales.

### Day 045: Deployment, Server, Domain, and Environment Design

**Goal:** Bring a simplified owner-production deployment into scope after auth, data, audit, and onboarding boundaries are known.

**Scope:**

- Use Cloudflare for domain/DNS and the application server layer.
- Use Cloudflare Workers with the OpenNext adapter as the default Next.js deployment path.
- Keep Supabase for database, Auth, RLS, RPC functions, and migrations.
- Define `app.<domain>` as the first owner-production application entry point.
- Document Cloudflare, Supabase, GitHub, environment variable, and secret ownership without exposing secrets.
- Define a minimal owner-production smoke test and rollback path.
- Keep Vercel documented as an alternative, not the default Day 045 path.

**Exit Criteria:**

- The owner-production deployment path is documented around Cloudflare Workers plus Supabase.
- Required Cloudflare and Supabase configuration is documented without exposing secrets.
- Builds are reproducible.
- Server/domain decisions are no longer ad hoc.
- External-pilot controls are explicitly deferred to Day 046 or later hardening.

### Day 046: Pilot Hardening and Commercial Readiness Gate

**Goal:** Harden the owner-production deployment and decide what remains before paid multi-customer rollout.

**Scope:**

- Add monitoring, error reporting, and operational health checks.
- Define backup and restore expectations.
- Review performance and mobile usability on real owner workflows.
- Record support, pricing, billing, terms, and data ownership gaps.
- Create a go/no-go checklist for commercial sale.

**Exit Criteria:**

- Owner-production readiness is explicitly reviewed.
- Commercial sale blockers are listed separately from pilot blockers.
- Monitoring and backup expectations are documented.
- The next roadmap can choose between deeper pilot iteration or SaaS packaging.

## Dependency Map

1. Day 037 must happen before trusting development Supabase reads.
2. Day 038 and Day 039 must happen before real writes.
3. Day 040 should happen before sales and purchase transactions, because those transactions depend on trusted catalog rows.
4. Day 041 and Day 042 can be implemented in either order after Day 040, but both must finish before production workflow claims.
5. Day 043 should follow the first write transactions so audit and correction rules cover real behavior before the standalone payment chain.
6. The standalone customer payment workflow should be scheduled after Day 046 or pulled into a later payment-specific sprint when pilot feedback confirms the needed collection flow.
7. Day 044 turns the first-store path into a repeatable customer path.
8. Day 045 enters simplified owner-production deployment design after auth, store context, and data write boundaries are known.
9. Day 046 is the hardening gate between owner usage and paid multi-customer rollout.

## Current Answers Captured

- **Can this be used externally now?** Not yet. It needs real auth, persistence, RLS verification, audit logs, backups, and deployment hardening.
- **Can this be sold to multiple customers now?** Not yet. It needs repeatable tenant/store onboarding, role authorization, isolation checks, admin/support flow, and commercial operations.
- **Is login implemented?** Only as a local demo boundary. Production authentication remains Day 038.
- **When do server and domain enter scope?** Day 045, as a simplified Cloudflare Workers plus Supabase owner-production deployment before commercial rollout.

## Sprint Management Notes

- Each sprint should get its own `docs/sprints/dayNNN_*.md` completion document when implemented.
- Larger implementation work should also get matching `docs/superpowers/specs/` and `docs/superpowers/plans/` files before code changes.
- Do not mark any sprint complete from tests alone; update the sprint doc with boundary, verification, and next-step notes.
- Keep production claims conservative until Day 046 explicitly gates pilot and commercial readiness.
