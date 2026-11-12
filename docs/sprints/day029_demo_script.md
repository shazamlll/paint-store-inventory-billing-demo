---
title: "Day 029 Demo Script"
created: 2026-06-24
updated: 2026-06-24
project: paint-store-inventory-billing
stage: completed
---

# Day 029 Demo Script

## Objective

Turn the local paint-store pitch and demo into a guided walkthrough script that can be used with a store owner in a five-minute conversation.

## Completed

- Added `demoScriptCopy` to `src/ux-copy.js` with the opening framing, route links, ordered talk track, proof notes, owner questions, and closing ask.
- Added `/demo/script` to the homepage navigation as `演示脚本`.
- Added `app/demo/script/page.js` as a compact presenter cue sheet.
- Added `test/demo-script.test.js` to cover the copy contract, ordered screens, navigation entry, route source, and sprint documentation.
- Added Sprint 029 design and implementation plan documents under `docs/superpowers`.

## Local Contract

- This is a local walkthrough aid, not a public onboarding guide.
- The script references existing local routes and does not automate browser navigation.
- The page stores no owner answers, interview notes, CRM records, analytics, or recordings.
- Supabase persistence, production authentication, roles, RLS, deployment, and multi-store behavior remain deferred.

## Deferred

- Customer interview note capture.
- Automated walkthrough playback.
- Public onboarding and help center copy.
- Deployment or installation guidance.
- Production security hardening, which remains in the post-Day030 backlog.

## Verification

- RED: `npm test -- test\demo-script.test.js`
- GREEN: `npm test -- test\demo-script.test.js`
- Full suite: `npm test`
- Production build: `npm run build`
- Route checks: `/demo/script` and `/`

## Correction

Continue to Day 030 MVP boundary and security backlog. The next sprint should turn the current demo scope into a clear pre-production checklist without changing persistence or auth behavior.
