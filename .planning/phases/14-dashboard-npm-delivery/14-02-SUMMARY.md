---
phase: 14-dashboard-npm-delivery
plan: 02
subsystem: infra
tags: [npm-packaging, install-pipeline, cli-launch, standalone-server, dashboard-delivery]

# Dependency graph
requires:
  - phase: 14-dashboard-npm-delivery
    provides: Standalone build pipeline with next.config.mjs, tsdown server config, and build:standalone script
provides:
  - copy-assets.cjs Section 4 copying standalone dashboard into dist/assets/dashboard/
  - NX implicit dependency ensuring dashboard builds before CLI
  - install.ts dashboard copy to .claude/dashboard/ with dashboard.json config
  - cli.ts Strategy 0 resolving installed standalone server before monorepo fallback
  - install.ts dashboard subcommand with auto-install and standalone launch
affects: [14-03, ci-publish, npm-tarball]

# Tech tracking
tech-stack:
  added: []
  patterns: [installed-standalone-first-resolution, dashboard-json-config-sibling, auto-install-on-missing]

key-files:
  created: []
  modified:
    - packages/cli/scripts/copy-assets.cjs
    - packages/cli/project.json
    - packages/cli/src/install.ts
    - packages/cli/src/cli.ts

key-decisions:
  - "dashboard.json placed NEXT TO dashboard/ dir (not inside) so it survives overwrite on upgrade"
  - "Auto-install dashboard from dist/assets/ if .claude/dashboard/ missing when user runs dashboard command"
  - "Strategy 0 in resolveDashboardServer checks installed standalone before @maxsim/dashboard package and monorepo"
  - "copyDirRecursive added as plain recursive copy helper (no path replacement needed for dashboard binary assets)"
  - "Standalone server cwd set to dashboard dir so Next.js can find .next/ directory"

patterns-established:
  - "Installed-standalone-first: check .claude/dashboard/server.js (local) then ~/.claude/dashboard/server.js (global) before dev fallbacks"
  - "Dashboard config sibling: dashboard.json lives next to dashboard/ dir with projectCwd for MAXSIM_PROJECT_CWD"
  - "Auto-install pattern: if dashboard not found at launch, copy from dist/assets/ and then launch"

requirements-completed: [DASH-04, DASH-05, DASH-06, DASH-07]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 14 Plan 02: CLI Asset Pipeline & Dashboard Launch Summary

**Dashboard standalone build wired into copy-assets, install.ts, and cli.ts with auto-install and installed-build-first resolution**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T19:52:37Z
- **Completed:** 2026-02-24T19:55:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extended copy-assets.cjs to copy standalone dashboard build (.next/standalone + .next/static + public) into dist/assets/dashboard/
- Added dashboard as NX implicit dependency so CLI build triggers dashboard build first
- Added dashboard install-time copy in install.ts with dashboard.json config sibling
- Reworked dashboard subcommand in install.ts: installed-build-first with auto-install fallback
- Added Strategy 0 in cli.ts resolveDashboardServer for installed standalone path resolution
- Updated cli.ts handleDashboard to set cwd to server directory and read dashboard.json for projectCwd

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend copy-assets.cjs for dashboard and add NX implicit dependency** - `7352c8c` (feat)
2. **Task 2: Add dashboard install-time copy and rework CLI launch command** - `1199bf2` (feat)

## Files Created/Modified
- `packages/cli/scripts/copy-assets.cjs` - Added Section 4: copies .next/standalone, .next/static, public to dist/assets/dashboard/
- `packages/cli/project.json` - Added "dashboard" to implicitDependencies array
- `packages/cli/src/install.ts` - Added copyDirRecursive helper, dashboard copy section in install(), reworked dashboard subcommand to use installed standalone build with auto-install
- `packages/cli/src/cli.ts` - Added os import, Strategy 0 in resolveDashboardServer(), dashboard.json reading and serverDir cwd in handleDashboard()

## Decisions Made
- dashboard.json placed next to dashboard/ directory (not inside) per locked decision -- survives overwrites on upgrade
- Auto-install from dist/assets/dashboard/ if .claude/dashboard/ not found when user runs dashboard command
- Strategy 0 (installed standalone) takes priority over @maxsim/dashboard package resolution and monorepo walk-up
- copyDirRecursive is a plain recursive copy without path replacement since dashboard is binary/compiled assets
- Standalone server spawned with cwd=serverDir so Next.js can find its .next/ directory relative to server.js

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete pipeline from standalone build -> dist/assets/dashboard/ -> .claude/dashboard/ -> `node server.js` is wired
- Plan 14-03 can now handle CI/CD integration, end-to-end testing of the npm package delivery
- TypeScript compilation verified clean (tsc --noEmit passes)

## Self-Check: PASSED

All created/modified files verified present on disk. Both task commits (7352c8c, 1199bf2) verified in git log.

---
*Phase: 14-dashboard-npm-delivery*
*Completed: 2026-02-24*
