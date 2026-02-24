---
phase: 14-dashboard-npm-delivery
plan: 03
subsystem: infra
tags: [ci-cd, github-actions, npm-publish, standalone-build, readme, documentation]

# Dependency graph
requires:
  - phase: 14-dashboard-npm-delivery
    provides: Standalone build pipeline (Plan 01) and CLI asset pipeline with dashboard launch (Plan 02)
provides:
  - CI publish workflow with STANDALONE_BUILD=true env var ensuring dashboard standalone output in production builds
  - Tarball validation step checking dashboard files are included in npm package
  - README documentation for npx maxsimcli dashboard command with auto-install behavior
affects: [npm-publish, end-users, dashboard-discovery]

# Tech tracking
tech-stack:
  added: []
  patterns: [ci-env-var-build-guard, tarball-validation-step, user-facing-dashboard-docs]

key-files:
  created: []
  modified:
    - .github/workflows/publish.yml
    - README.md

key-decisions:
  - "STANDALONE_BUILD env var added to CI Build step (not a separate step) since NX implicit dependency handles build ordering"
  - "Tarball validation uses pnpm pack --dry-run with grep checks for dashboard server.js and .next files"
  - "README dashboard section updated to reflect npm-shipped dashboard (not monorepo-only)"

patterns-established:
  - "CI env-var guard: set STANDALONE_BUILD=true only in CI Build step; dev builds skip standalone by default"
  - "Tarball validation: pnpm pack --dry-run + grep for critical files as CI safety net"

requirements-completed: [DASH-08, DASH-09]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 14 Plan 03: CI Publish Workflow & README Documentation Summary

**CI publish workflow configured with STANDALONE_BUILD=true env var, tarball validation for dashboard files, and README documenting npx maxsimcli dashboard for end users**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T19:57:00Z
- **Completed:** 2026-02-24T20:05:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments
- Added STANDALONE_BUILD=true env var to CI Build step in publish.yml, ensuring dashboard produces standalone output when published
- Added tarball validation step that checks for dashboard/server.js and dashboard/.next in the npm package
- Updated README Live Dashboard section to document npx maxsimcli dashboard with auto-install, auto-open, and real-time features
- Human verification checkpoint approved -- full end-to-end pipeline confirmed: standalone build -> copy-assets -> install -> launch -> CI publish

## Task Commits

Each task was committed atomically:

1. **Task 1: Update CI publish workflow for standalone dashboard build and validate tarball** - `b01046b` (feat)
2. **Task 2: Add dashboard section to README** - `15dfc5f` (docs)
3. **Task 3: Human verification checkpoint** - approved (no commit, verification-only)

## Files Created/Modified
- `.github/workflows/publish.yml` - Added STANDALONE_BUILD: 'true' env var to Build step; added tarball validation step with pnpm pack --dry-run checks
- `README.md` - Updated Live Dashboard section documenting npx maxsimcli dashboard with auto-install behavior, port auto-detection, and real-time WebSocket features

## Decisions Made
- STANDALONE_BUILD env var added directly to the existing Build step (not a separate step) because NX implicit dependency already ensures dashboard builds before CLI
- Tarball validation uses pnpm pack --dry-run with grep for dashboard/server.js and dashboard/.next as a CI safety net
- README dashboard section updated in place (replacing Phase 13 monorepo-only docs) to reflect the npm-shipped standalone dashboard

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 14 (Dashboard npm Delivery) is now complete with all 3 plans executed
- Full pipeline verified: Next.js standalone build -> copy-assets.cjs -> install.ts -> cli.ts launch -> CI publish
- All 9 DASH requirements (DASH-01 through DASH-09) are satisfied across Plans 01, 02, and 03
- Next push to main will trigger the updated CI pipeline and publish dashboard inside maxsimcli

## Self-Check: PASSED

All created/modified files verified present on disk. Both task commits (b01046b, 15dfc5f) verified in git log.

---
*Phase: 14-dashboard-npm-delivery*
*Completed: 2026-02-24*
