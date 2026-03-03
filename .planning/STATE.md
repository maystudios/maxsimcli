# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Every AI-assisted coding task runs with the right amount of context — no more, no less — producing consistent, correct output from phase 1 to phase 50.
**Current focus:** Phase 16 — Codebase Cleanup (complete)

## Current Position

Milestone: v5.0 SDD-Native Architecture
Phase: 16 of 20 (Codebase Cleanup) -- Complete
Plan: 1 of 1 in current phase (16-01-PLAN.md) -- Complete
Status: complete
Last activity: 2026-03-03 -- Phase 16 plan 01 complete (adapter removal, Claude-only cleanup)

Progress: [█████████████████░░░] v2.0 done (15/15), v5.0 in progress (1/5)

## Performance Metrics

**v2.0 Velocity:**
- Total plans completed: 4
- Average duration: 13m 51s
- Total execution time: 0.92 hours

**By Phase (v2.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | 55m 22s | 13m 51s |

**By Phase (v5.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 16 | 1 | 6m 52s | 6m 52s |

**Recent Trend:**
- Last 5 plans: 01-02 (5m 14s), 01-03 (42m 31s), 01-04 (2m 8s), 16-01 (6m 52s)
- v5.0 velocity: 6m 52s avg (1 plan)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **v5.0 scope**: Claude Code only — drop all multi-runtime adapter abstractions
- **v5.0 strategy**: Agents and skills must operate as a coordinated system, not isolated prompts. Context assembly is role-aware per agent type.
- **Skill rename**: `simplify` → `maxsim-simplify`, `batch` → `maxsim-batch` to avoid Claude Code built-in command collisions
- **Spec drift**: New `/maxsim:check-drift` command compares `.planning/` to actual codebase, offers two-way realignment (update spec OR generate fix plan)
- **Init depth**: Both new-project and init-existing must ask tech stack questions AND run agentic research before generating any plan
- **Two-stage review**: Spec compliance + code quality review is the standard post-task workflow, not optional
- **Phase order**: Phase 16 (cleanup) first — clean foundation before touching prompts. Phase 17 (skills) and Phase 18 (init) can run in parallel after 16. Phase 19 (agents) depends on 17+18. Phase 20 (drift) depends on 19.

### Architecture (v2.0 decisions retained):

- THREE INDEPENDENT LAYERS: Claude Code standalone + Core Server (MCP) + Dashboard (optional UI)
- .mcp.json auto-discovery replaces need for session-start hook
- MCP install is optional (graceful fallback to Bash tools router)
- Skills installed at `.claude/skills/maxsim-*/SKILL.md`
- `using-maxsim` registered in AGENTS.md (not hooks)

### Pending Todos

None.

### Blockers/Concerns

- ~~CLEAN-01/CLEAN-02: Multi-runtime adapter dead code still present — Phase 16 removes it~~ RESOLVED (16-01)
- SKILL-07: `simplify` and `batch` skill names conflict with Claude Code built-ins — Phase 17 renames them
- AGENT-02: Context assembly is currently ad-hoc — Phase 19 formalizes per-role context rules
- DRIFT-01: No drift detection mechanism exists yet — Phase 20 builds `/maxsim:check-drift`

## Session Continuity

Last session: 2026-03-03
Stopped at: Completed 16-01-PLAN.md (adapter removal and Claude-only cleanup)
Resume file: None
Next action: Phase 16 complete. Ready for Phase 17 (Skills Overhaul) or Phase 18 (Init Redesign).
