---
phase: 03-Agent-Coherence
plan: 03
subsystem: cli-init-commands
tags: [agent-context, init-commands, frontmatter-schema, role-filtering]
duration: ~11min
completed: 2026-03-07
---

# Plan 03-03 Summary: Agent-Level Init Commands and Review Schema

## Objective

Create 5 new agent-level init commands that return role-filtered context, add TypeScript interfaces for each, and add a review frontmatter schema for machine-parseable review validation.

## What Was Built

### Agent Context Interfaces (types.ts)

5 new TypeScript interfaces added to `packages/cli/src/core/types.ts`:

- **ExecutorAgentContext** -- executor_model, verifier_model, branching_strategy, parallelization, phase info, codebase_docs
- **PlannerAgentContext** -- planner_model, checker_model, research/plan_checker flags, phase artifacts, codebase_docs
- **ResearcherAgentContext** -- researcher_model, brave_search, phase artifacts (no executor_model, no branching_strategy, no parallelization)
- **VerifierAgentContext** -- verifier_model, phase info, requirement IDs, codebase_docs
- **DebuggerAgentContext** -- debugger_model, phase info (optional), codebase_docs (phase is optional for debugger)

### Agent-Level Init Functions (init.ts)

5 new functions added after existing workflow-level inits:

- `cmdInitExecutor(cwd, phase)` -- includes execution-specific fields (branching, parallelization)
- `cmdInitPlanner(cwd, phase)` -- includes planning-specific fields (research, plan_checker, context/research artifacts)
- `cmdInitResearcher(cwd, phase)` -- includes research-specific fields (brave_search, padded_phase, context artifact)
- `cmdInitVerifier(cwd, phase)` -- includes verification-specific fields (requirement IDs)
- `cmdInitDebugger(cwd, phase)` -- phase is optional, includes debugger_model

Helper function `listCodebaseDocs(cwd)` scans `.planning/codebase/` for .md files, returns relative paths array.

### CLI Router Registration (cli.ts)

5 new entries added to `handleInit` dispatcher: `executor`, `planner`, `researcher`, `verifier`, `debugger`. Error message updated to list new subcommands.

### Review Frontmatter Schema (frontmatter.ts)

New `review` schema in `FRONTMATTER_SCHEMAS` with required fields: `status`, `critical_count`, `warning_count`. Enables `frontmatter validate {file} --schema review` for machine-parseable review output validation.

## Key Decisions

- Agent-level init commands are ADDITIONS alongside existing workflow-level inits (not replacements)
- Each agent init uses `listCodebaseDocs()` to include all codebase docs (no role-based filtering)
- Debugger init allows phase to be undefined (returns null phase fields)
- Researcher init includes `padded_phase` and `context_path` from artifacts scan

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | fbf055c | Agent context interfaces + 5 init functions + listCodebaseDocs helper |
| 2 | bc350a2 | CLI router registrations + review schema + index.ts exports |

## Files Modified

| File | Changes |
|------|---------|
| `packages/cli/src/core/types.ts` | +5 agent context interfaces (~85 lines) |
| `packages/cli/src/core/init.ts` | +5 init functions + listCodebaseDocs helper (~165 lines) |
| `packages/cli/src/cli.ts` | +5 handler entries + 5 imports + updated error message |
| `packages/cli/src/core/frontmatter.ts` | +1 review schema entry |
| `packages/cli/src/core/index.ts` | +6 function exports + 5 type exports |

## Verification Results

- TypeScript compiles without errors in modified files (pre-existing errors in unrelated files: dashboard-launcher, phase.ts, install, mcp)
- CLI build succeeds
- All 5 init commands return valid JSON with role-filtered fields
- Researcher init confirmed to exclude executor_model and branching_strategy
- Review frontmatter validation returns valid for correct schema
- Existing init commands (execute-phase, plan-phase) still work

## Deviations

None.
