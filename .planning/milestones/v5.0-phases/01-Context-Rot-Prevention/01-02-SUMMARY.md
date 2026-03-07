---
phase: 01-Context-Rot-Prevention
plan: 02
one-liner: "Stale context detection command and milestone-level STATE.md reset with archive snapshots"
status: complete
started: 2026-03-06T22:16:49Z
completed: 2026-03-06T22:25:00Z
tasks_completed: 2
tasks_total: 2
---

# Plan 01-02 Summary: Stale Context Detection + Milestone Reset

## What Was Built

1. **cmdDetectStaleContext** in `state.ts` -- Scans ROADMAP.md for completed phases (checkbox `[x]`), then scans STATE.md Decisions and Blockers sections for any `Phase N` references to those completed phases. Returns a structured report with `stale_references`, `completed_phases`, and `clean` boolean.

2. **Updated cmdMilestoneComplete** in `milestone.ts` -- Converted from sync fs to async fsp. Now uses `archivePath` helper (from Plan 01) instead of legacy `.planning/milestones/` path. Before resetting, snapshots STATE.md and ROADMAP.md to `.planning/archive/<milestone>/`. After snapshot, resets STATE.md to a clean template with no decisions, blockers, or metrics carried forward.

3. **CLI dispatch** -- Added `detect-stale-context` command entry in `cli.ts`.

4. **Tests** -- 10 test cases covering stale detection (5) and milestone reset (5), all passing.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | ed1c460 | feat(01-02): add stale context detection and milestone STATE.md reset |
| 2 | 28e6793 | test(01-02): add stale detection and milestone reset tests |

## Key Files Modified

- `packages/cli/src/core/state.ts` -- added `cmdDetectStaleContext`, `StaleReference` interface
- `packages/cli/src/core/milestone.ts` -- async rewrite, archivePath, STATE snapshot + reset
- `packages/cli/src/core/types.ts` -- extended `MilestoneResult` with snapshot/reset fields
- `packages/cli/src/core/index.ts` -- export `cmdDetectStaleContext`
- `packages/cli/src/cli.ts` -- dispatch entry + async milestone handler
- `packages/cli/tests/stale-detection.test.ts` -- 10 test cases

## Key Decisions

- Milestone STATE.md reset uses a hardcoded clean template rather than reading/modifying existing content, ensuring complete isolation between milestones
- STATE/ROADMAP snapshots saved as plain `STATE.md`/`ROADMAP.md` in archive dir (not version-prefixed) for direct readability

## Deviations

- [Rule 3 - Blocking] Updated `handleMilestone` in cli.ts to async since `cmdMilestoneComplete` is now async -- required for correct execution

## Verification

- TypeScript compilation: PASS (no new errors in modified files)
- Stale detection tests: 10/10 PASS
- Archive tests (Plan 01): 13/13 PASS (no regressions)
- Full build: PASS
