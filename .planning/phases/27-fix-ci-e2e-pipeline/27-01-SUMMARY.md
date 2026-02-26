---
phase: 27-fix-ci-e2e-pipeline
plan: 01
subsystem: infra
tags: [ci, e2e, github-actions, vitest]

# Dependency graph
requires:
  - phase: 26-superpowers-enhancements
    provides: "2 new agent files (spec-reviewer, code-reviewer) that changed agent count to 13"
provides:
  - "Dedicated e2e job in publish.yml CI pipeline"
  - "Release job gated on both build-and-test and e2e passing"
  - "Correct agent count assertion (13) in install E2E test"
affects: [ci-pipeline, e2e-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: ["CI e2e job runs full build + npm run e2e before release"]

key-files:
  created: []
  modified:
    - ".github/workflows/publish.yml"
    - "packages/cli/tests/e2e/install.test.ts"

key-decisions:
  - "E2E job does its own checkout+install+build (GitHub Actions does not share artifacts between jobs without upload-artifact)"
  - "Pre-existing DASH-08 failure logged as deferred item, not fixed (out of scope)"

patterns-established:
  - "CI gate pattern: release needs [build-and-test, e2e] to block publish on E2E failure"

requirements-completed: [CI-01, E2E-03]

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 27 Plan 01: Fix CI E2E Pipeline Summary

**Dedicated e2e job added to publish.yml gating npm release, and agent count assertion fixed from 11 to 13**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T15:19:54Z
- **Completed:** 2026-02-26T15:21:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added dedicated `e2e` job to publish.yml that runs `npm run e2e` after a full build with `STANDALONE_BUILD=true`
- Gated release job on both `build-and-test` and `e2e` jobs passing, preventing regressions from shipping
- Fixed stale agent count assertion from 11 to 13 matching the actual 13 agent files after Phase 26

## Task Commits

Each task was committed atomically:

1. **Task 1: Add e2e job to publish.yml and gate release on it** - `4afbb97` (fix)
2. **Task 2: Fix agent count assertion from 11 to 13 and verify E2E suite passes** - `48394a4` (test)

## Files Created/Modified
- `.github/workflows/publish.yml` - Added e2e job between build-and-test and release; updated release needs array
- `packages/cli/tests/e2e/install.test.ts` - Updated agent count assertion from toHaveLength(11) to toHaveLength(13)

## Decisions Made
- E2E job performs its own checkout + npm ci + npm run build because GitHub Actions does not share build artifacts between jobs without explicit upload-artifact/download-artifact steps
- Pre-existing DASH-08 dashboard test failure (roadmap goal returns null) is out of scope and logged to deferred-items.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing DASH-08 test failure in dashboard.test.ts (`/api/roadmap` goal field returns null instead of expected string). This is unrelated to the CI pipeline or agent count changes and was already failing before this plan. Logged to `deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CI pipeline now runs E2E tests before every release
- DASH-08 pre-existing failure should be investigated in a future phase (logged in deferred-items.md)
- Phase 28 can proceed with confidence that E2E regressions will block npm publish

---
*Phase: 27-fix-ci-e2e-pipeline*
*Completed: 2026-02-26*
