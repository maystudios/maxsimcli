---
phase: "04"
plan: "01"
subsystem: drift-detection-core
tags: [drift, types, cli-tools, init-context, frontmatter]
duration: "~10min"
completed: "2026-03-07"
---

# Plan 04-01 Summary: Drift Core Module, Types, and CLI Wiring

## What Was Built

New `drift.ts` core module with 6 CLI tool commands, TypeScript type definitions for the drift detection subsystem, frontmatter schema for drift reports, init context assembly for check-drift and realign workflows, and full CLI dispatch wiring. This is the foundation layer that the drift-checker agent (Plan 02) and realign workflow (Plan 03) will consume.

## Key Decisions

- **Model tier for drift-checker:** Reuses the verifier/integration-checker model tier (`sonnet` on balanced, `haiku` on budget) since drift analysis is similarly analysis-heavy. Added `maxsim-drift-checker` to `MODEL_PROFILES` in `core.ts`.
- **No `decisions_path` or `acceptance_criteria_path`:** The plan's CheckDriftContext type from research included these fields, but they don't correspond to actual MAXSIM planning files. Removed them to keep the context accurate.
- **Synchronous drift commands:** All 6 drift cmd* functions are synchronous (no async needed) since they only do filesystem reads/writes. This simplifies the CLI dispatch handler.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 01 | `63f0376` | Drift types, frontmatter schema, and core drift module |
| 02 | `213b52c` | Init context commands and CLI dispatch wiring |

## Files Modified

| File | Change |
|------|--------|
| `packages/cli/src/core/drift.ts` | NEW -- 6 cmd* functions: read/write report, extract requirements/nogos/conventions, previous hash |
| `packages/cli/src/core/types.ts` | Added DriftReportFrontmatter, CheckDriftContext, RealignContext interfaces; DriftStatus/DriftSeverity/DriftDirection/DriftItemStatus type aliases; maxsim-drift-checker to AgentType |
| `packages/cli/src/core/frontmatter.ts` | Added `drift` schema to FRONTMATTER_SCHEMAS |
| `packages/cli/src/core/core.ts` | Added maxsim-drift-checker to MODEL_PROFILES |
| `packages/cli/src/core/init.ts` | Added cmdInitCheckDrift, cmdInitRealign; check-drift/realign to WorkflowType; imported getArchivedPhaseDirs |
| `packages/cli/src/core/index.ts` | Barrel exports for drift types and drift module functions |
| `packages/cli/src/cli.ts` | handleDrift handler, drift COMMANDS entry, check-drift/realign in handleInit |

## New CLI Commands

- `drift read-report` -- Read and parse DRIFT-REPORT.md
- `drift write-report --content <md> | --content-file <path>` -- Write drift report
- `drift extract-requirements` -- Parse REQUIREMENTS.md into structured requirement objects
- `drift extract-nogos` -- Parse NO-GOS.md into structured no-go items
- `drift extract-conventions` -- Return CONVENTIONS.md content for agent analysis
- `drift previous-hash` -- Get previous report hash and date for diff tracking
- `init check-drift` -- Assemble CheckDriftContext for the drift-checker agent
- `init realign [direction]` -- Assemble RealignContext for the realign workflow

## Deviations

- **[Rule 3 - Blocking Issue]** Task 01: Adding `maxsim-drift-checker` to the `AgentType` union required a corresponding entry in `MODEL_PROFILES` in `core.ts` (TypeScript structural typing enforced this). Added drift-checker with verifier-tier model assignments as recommended by research.

## Verification Results

- TypeScript: zero new errors (all errors are pre-existing in dashboard-launcher, phase, install, mcp)
- Build: `npm run build:cli` succeeds
- Tests: 212 passed across 10 test files
- All 8 new CLI commands return correct JSON output
