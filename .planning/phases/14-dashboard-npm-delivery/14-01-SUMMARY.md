---
phase: 14-dashboard-npm-delivery
plan: 01
subsystem: infra
tags: [nextjs, standalone, tsdown, build-pipeline, npm-packaging]

# Dependency graph
requires:
  - phase: 13-live-project-dashboard
    provides: Working dashboard with server.ts, next.config.mjs, and package.json
provides:
  - Env-var guarded standalone output in next.config.mjs (STANDALONE_BUILD=true)
  - tsdown.config.server.ts for server bundling with correct externals
  - build:standalone script chaining next build + static copy + server bundle + server copy
  - NX build target updated to produce standalone output
affects: [14-02, 14-03, copy-assets, install, ci-publish]

# Tech tracking
tech-stack:
  added: []
  patterns: [env-var-guarded-standalone, tsdown-server-bundle-config-file, build-standalone-script-chain]

key-files:
  created:
    - packages/dashboard/tsdown.config.server.ts
  modified:
    - packages/dashboard/next.config.mjs
    - packages/dashboard/package.json
    - packages/dashboard/project.json

key-decisions:
  - "STANDALONE_BUILD env-var guard in next.config.mjs to avoid Windows EPERM symlink errors in dev"
  - "tsdown config file (not inline CLI flags) for server bundling clarity and maintainability"
  - "POSIX env syntax in build:standalone (CI runs Ubuntu; Windows devs use dev not standalone)"
  - "NX build target switched to build:standalone so nx build dashboard produces standalone output"

patterns-established:
  - "Env-var guarded standalone: spread STANDALONE_BUILD conditional into nextConfig object"
  - "Server bundling config: tsdown.config.server.ts with next external, custom deps inlined"
  - "Four-step standalone build chain: next build -> static+public copy -> tsdown bundle -> server copy"

requirements-completed: [DASH-01, DASH-02, DASH-03]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 14 Plan 01: Standalone Build Pipeline Summary

**Next.js standalone build pipeline with env-var guard, tsdown server bundling config, and four-step build:standalone script for self-contained dashboard packaging**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-24T19:47:40Z
- **Completed:** 2026-02-24T19:49:44Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Configured next.config.mjs with STANDALONE_BUILD env-var guard and outputFileTracingRoot for monorepo
- Created tsdown.config.server.ts that inlines ws/chokidar/detect-port/open and externalizes next
- Added build:standalone script chaining all 4 build steps (next build, static+public copy, server bundle, server copy to standalone)
- Updated NX build target to produce standalone output with correct cache outputs

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Next.js standalone output with env-var guard and server bundling config** - `653bb62` (feat)
2. **Task 2: Create build:standalone script and update NX build target** - `ea3b238` (feat)

## Files Created/Modified
- `packages/dashboard/next.config.mjs` - Added path/fileURLToPath imports, STANDALONE_BUILD conditional with outputFileTracingRoot
- `packages/dashboard/tsdown.config.server.ts` - New tsdown config for server bundling with next external, ws/chokidar/detect-port/open inlined
- `packages/dashboard/package.json` - Added build:standalone script with four-step chain
- `packages/dashboard/project.json` - NX build target switched to build:standalone, .next/standalone added to outputs

## Decisions Made
- Used STANDALONE_BUILD env-var guard (not always-on standalone) to avoid Windows EPERM symlink errors during development with pnpm
- Created a dedicated tsdown.config.server.ts config file instead of extending the existing inline CLI flags in build:server, for clarity and maintainability
- Used POSIX env syntax (STANDALONE_BUILD=true) in build:standalone since standalone builds only run in CI (Ubuntu) -- Windows developers use dev mode, not standalone
- Switched NX build target from build to build:standalone so that nx build dashboard produces the standalone output needed by the CLI package

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Standalone build pipeline is configured and ready to produce .next/standalone/ output
- Plan 14-02 can now extend copy-assets.cjs to copy standalone build into dist/assets/dashboard/
- Plan 14-02 will also wire install.ts dashboard copy and CLI launch rework
- server.ts was NOT modified (confirmed unchanged) -- existing server works in standalone mode

## Self-Check: PASSED

All created/modified files verified present on disk. Both task commits (653bb62, ea3b238) verified in git log.

---
*Phase: 14-dashboard-npm-delivery*
*Completed: 2026-02-24*
