# Day 039 Store Context and Role Authorization

## Goal

Connect the authenticated browser session to the current user's active store context, then use that context to shape the app shell navigation and page access.

## Completed

- Added `loadStoreContext` to read active `store_members` rows and joined `stores` data for the signed-in user.
- Added role gates for `owner`, `clerk`, and `accountant`.
- Added role-filtered navigation so clerks see daily sales and inventory basics while accountants see reporting pages.
- Wired `AppShell` to load the active store, show the active store and role, and block pages outside the current role.
- Added authenticated `select` grants for `stores` and `store_members` in the development migration path.

## Boundaries

- This sprint only enables store context reads and client-side role shaping.
- Business writes remain blocked for the production authentication path.
- Server-side write authorization, business write APIs, audit logs, and role-scoped mutations remain outside this sprint.
- RLS is still the durable data isolation layer; the app shell gate is a user experience and defense-in-depth layer, not the final authorization boundary.

## Role Matrix

| Role | Allowed foundation | Explicit gaps |
| --- | --- | --- |
| `owner` | All operational pages | None in this client gate |
| `clerk` | Sales, purchases, inventory basics, products, customers, search, dashboard | Inventory adjustments and reports |
| `accountant` | Reports and dashboard | Sales, purchases, inventory, catalog, and search pages |

## Next

Day 040 should decide the first production-safe business read path that uses the active store id, with tests proving that data remains scoped to the current store.
