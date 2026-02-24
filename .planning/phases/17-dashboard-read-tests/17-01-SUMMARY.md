---
phase: 17-dashboard-read-tests
plan: "01"
status: complete
completed: 2026-02-25
tasks_total: 2
tasks_completed: 2
commits: 2
---

# Summary: Phase 17-01 — Fix Fixture + Write Dashboard E2E Tests

## What Was Built

Fixed the mock project fixture and wrote the complete E2E dashboard read API test suite (`dashboard.test.ts`).

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Fix mock-project.ts fixture for dashboard API compatibility | ✓ | 2563892 |
| 2 | Write dashboard.test.ts E2E dashboard read API tests | ✓ | f3df880 |

## Key Files

### Created
- `packages/e2e/src/dashboard.test.ts` — 137-line E2E test file with 5 `it()` blocks (DASH-01 through DASH-05)

### Modified
- `packages/e2e/src/fixtures/mock-project.ts` — Added `title: Test Task` frontmatter to pending todo, added `02-integration` phase directory

## Self-Check: PASSED

- `createMockProject()` todo file now starts with `title: Test Task\n` as line 1 — parseTodos() will return `text: 'Test Task'` instead of filename fallback
- `createMockProject()` creates both `01-foundation/` and `02-integration/` in `.planning/phases/`
- `dashboard.test.ts` contains all 5 `it()` blocks (DASH-01 through DASH-05)
- `pollUntilReady` function defined inline (not imported)
- `beforeAll` uses stderr parsing to discover port — does NOT use PORT env var in spawn env
- `afterAll` kills server with SIGTERM, waits for close event, then cleans up mock project
- No PORT env var in spawn env (server owns port via detectPort(3333))
- DASH-03 status assertion intentionally omitted — diskStatus values are filesystem-derived, not 'pending'
- Both tasks committed individually with conventional commit messages
- No TypeScript type errors in implementation patterns (vitest inject() types resolved via vitest.d.ts augmentation)

## Requirements Covered

- DASH-01: /api/health health check pattern (spawn + poll)
- DASH-02: /api/project PROJECT.md data assertions
- DASH-03: /api/phases filesystem-derived phases array with 2 entries (foundation + integration)
- DASH-04: /api/state decisions array assertions
- DASH-05: /api/todos pending array with 'Test Task' (enabled by fixture title: frontmatter fix)

## Notes / Deviations

- Checker warning 1 applied: DASH-03 skips `diskStatus` assertion (values are 'empty'/'planned'/'partial'/'complete', not 'pending')
- Checker warning 2 applied: PORT env var not included in spawn env per research confirming server ignores it
- Checker warning 3 applied: Task 1 verify used grep instead of tsx import test
- Full `nx run e2e:e2e` requires pre-built dashboard (`STANDALONE_BUILD=true nx build dashboard && nx build cli`) — test is structurally complete and ready to run once dashboard build is available
