---
phase: 02-Deep-Init-Questioning
plan: 03
subsystem: templates, cli
tags: [workflow-integration, questioning-gate, conventions, dry-run, init]

# Dependency graph
requires:
  - phase: 02-01
    provides: Enhanced questioning.md with domain checklist, no-gos tracking, research agent output formats
  - phase: 02-02
    provides: CONVENTIONS.md template, PROJECT.md Tech Stack Decisions section
provides:
  - new-project.md workflow with deep questioning gate, no-gos confirmation, CONVENTIONS.md generation, research approval gate, dry-run validation
  - init-existing.md workflow with stack preference questions, convention confirmation, scan-based no-gos, dry-run validation
  - init.ts context assembly with conventions_path for downstream agents
affects: [all downstream agents consuming init context, planner, executor]

# Tech tracking
tech-stack:
  added: []
  patterns: [coverage-gate-orchestration, dry-run-validation, stack-preference-flow]

key-files:
  modified:
    - templates/workflows/new-project.md
    - templates/workflows/init-existing.md
    - packages/cli/src/core/init.ts

key-decisions:
  - "Dry-run validation uses planner model (cheap, sufficient for gap detection) with explicit 'Do NOT infer' instruction"
  - "Coverage summary shown to user before Ready? gate (transparency over hidden tracking)"
  - "Stack preference questions capped at 8-10 items, filtering out utility libraries"
  - "conventions_path added as optional field to PlanPhaseContext and PhaseOpContext only (the two downstream contexts)"

patterns-established:
  - "Agent dry-run validation pattern: spawn test agent with all docs, report gaps, fill before completing init"
  - "Coverage gate pattern: silent tracking + explicit display at gate boundary"
  - "Stack preference flow: scan -> filter architecturally significant -> keep/evolve/replace"

requirements-completed: [INIT-01, INIT-02, INIT-03, INIT-04]

# Metrics
duration: 6min
completed: 2026-03-07
---

# Plan 02-03: Workflow Integration Summary

**Wired deep questioning gate, CONVENTIONS.md generation, research approval, and agent dry-run validation into both init workflow orchestration files, plus conventions_path in CLI context assembly**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-07T00:07:47Z
- **Completed:** 2026-03-07T00:13:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Enhanced new-project.md (1226 -> 1414 lines) with domain coverage gate, no-gos confirmation, locked decisions approval, CONVENTIONS.md generation, and agent dry-run validation
- Enhanced init-existing.md (1221 -> 1408 lines) with stack preference questions, convention confirmation, CONCERNS.md no-gos integration, and agent dry-run validation
- Added conventions_path to init.ts PlanPhaseContext and PhaseOpContext interfaces with existence-check pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire templates into init workflows** - `f83a649` (feat)
2. **Task 2: Add conventions_path to init.ts** - `50c3d10` (feat)

## Files Modified

- `templates/workflows/new-project.md` - Added questioning gate orchestration (80%, 10 rounds), no-gos confirmation, research approval gate, CONVENTIONS.md generation, dry-run validation (+188 lines)
- `templates/workflows/init-existing.md` - Added stack preference questions (Step 6b), convention confirmation (Step 6c), scan no-gos (Step 6d), dry-run validation (Step 9g) (+187 lines)
- `packages/cli/src/core/init.ts` - Added conventions_path to 2 interfaces and 2 function implementations (+8 lines)

## Decisions Made

- Dry-run validation prompt explicitly says "Do NOT infer missing information" to prevent false passes (from research Pitfall 5)
- Stack preference questions filter to framework-level only and cap at 8-10 items (from research Pitfall 6)
- Coverage summary displayed to user before Ready? gate for transparency
- conventions_path is optional (only present when file exists), consistent with how other optional paths work

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript compilation errors in other files (dashboard-launcher.ts, phase.ts, install/index.ts, mcp/*.ts) - not related to init.ts changes. init.ts compiles cleanly.

## Verification

- Task 01: 15/15 automated content checks passed on both workflow files
- Task 02: TypeScript compilation clean for init.ts (0 errors in modified file)
- Full build: npm run build succeeds

---
*Phase: 02-Deep-Init-Questioning*
*Plan: 03*
*Completed: 2026-03-07*
