---
phase: 23-e2e-wiring-nextjs-cleanup
plan: 01
subsystem: infra
tags: [nx, e2e, vite, cleanup]

requires:
  - phase: 22-fix-node-pty-lazy-load
    provides: "E2E test infrastructure"
provides:
  - "E2E depends on dashboard:build via NX dependsOn"
  - "Clean Vite-only dashboard with no Next.js artifacts"
affects: [e2e, dashboard]

tech-stack:
  added: []
  patterns: ["NX dependsOn for cross-package build ordering"]

key-files:
  created: []
  modified:
    - packages/e2e/project.json
    - packages/dashboard/tsconfig.json

key-decisions:
  - "Removed stale .next and app entries from tsconfig.json exclude during cleanup"

patterns-established: []

requirements-completed: [E2E-01]

duration: 1min
completed: 2026-02-25
requirements_completed: [E2E-01]
---

# Phase 23 Plan 01: E2E Wiring and Next.js Cleanup Summary

**E2E dependsOn wired to dashboard:build, 29 orphaned Next.js files removed from dashboard package**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-25T10:12:07Z
- **Completed:** 2026-02-25T10:13:09Z
- **Tasks:** 2
- **Files modified:** 30

## Accomplishments
- E2E target now depends on both cli:build and dashboard:build ensuring tests run against latest dashboard
- Removed entire orphaned app/ directory (26 files), next.config.mjs, postcss.config.mjs
- Cleaned stale .next and app references from tsconfig.json exclude
- Dashboard builds cleanly with Vite after cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Add dashboard:build to e2e dependsOn** - `01916c9` (feat)
2. **Task 2: Delete all orphaned Next.js files** - `199d66b` (chore)

## Files Created/Modified
- `packages/e2e/project.json` - Added dashboard:build to e2e dependsOn array
- `packages/dashboard/tsconfig.json` - Removed stale .next and app from exclude
- `packages/dashboard/app/` - Deleted (26 orphaned Next.js files)
- `packages/dashboard/next.config.mjs` - Deleted
- `packages/dashboard/postcss.config.mjs` - Deleted

## Decisions Made
- Removed stale .next and app entries from tsconfig.json exclude since the directories no longer exist after cleanup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Cleaned stale tsconfig.json exclude entries**
- **Found during:** Task 2 (Next.js cleanup)
- **Issue:** tsconfig.json exclude had .next and app entries referencing now-deleted directories
- **Fix:** Removed both stale entries from exclude array
- **Files modified:** packages/dashboard/tsconfig.json
- **Verification:** Dashboard builds cleanly
- **Committed in:** 199d66b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Necessary cleanup of stale config. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- E2E tests will now trigger dashboard:build before running
- Dashboard is cleanly Vite-only with no Next.js remnants

---
*Phase: 23-e2e-wiring-nextjs-cleanup*
*Completed: 2026-02-25*
