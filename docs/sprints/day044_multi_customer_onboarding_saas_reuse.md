---
title: "Day 044 Multi-Customer Onboarding and SaaS Reuse"
created: 2026-06-30
project: paint-store-inventory-billing
stage: completed
---

# Day 044 Multi-Customer Onboarding and SaaS Reuse

## Goal

Turn the first-store setup path into a repeatable customer onboarding flow that can create a second store without code changes.

## Completed Scope

- Added `src/customer-onboarding.js` for reusable store onboarding plans and provisioning payload preparation.
- Added `supabase/migrations/0006_store_onboarding.sql`.
- Added `public.store_onboarding_runs` to track store setup status and checklist items.
- Added `public.provision_store_owner(p_payload jsonb)` to create a store, bind the authenticated owner user, and create an onboarding run in one server-side transaction.
- Kept owner user identity server-controlled by requiring `owner_user_id` to match `auth.uid()`.
- Preserved the Day 031 CSV template import sequence as the onboarding checklist.

## Onboarding Flow

1. Support creates or invites the owner user in Supabase Auth.
2. The owner signs in.
3. The owner provisions their store through `provision_store_owner`.
4. Support imports products, customers, suppliers, opening stock, and opening receivables from the approved CSV templates.
5. Support verifies store isolation and hands off the owner login.

## SaaS Reuse Boundary

A second store can be created without code changes. Store data remains isolated through existing `store_id` RLS and the owner membership created by the provisioning RPC.

This sprint does not add a full admin console. The minimum support/admin tooling is a documented operational flow plus a server-side provisioning RPC. A richer admin UI can be built after pilot behavior is stable.

## Deployment Boundary

Deployment remains Day 045. Day 044 only makes onboarding repeatable enough that domain, server, environment, and DNS decisions can be designed without guessing how a new customer is activated.

## Verification

- `test/customer-onboarding.test.js` covers onboarding checklist, validation, authenticated owner provisioning, RPC boundary, SQL migration, and sprint documentation.
- Full verification should run `npm test` and `npm run build` before release or push.

## Remaining Work

- Build a support/admin UI for creating invitations and tracking onboarding runs.
- Add real CSV import execution for each onboarding checklist item.
- Add a store switcher if one user owns or supports multiple stores.
- Bring deployment, domain, CI, backup, and rollback into Day 045.
