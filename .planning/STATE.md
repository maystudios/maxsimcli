# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Every AI-assisted coding task runs with the right amount of context -- no more, no less -- producing consistent, correct output from phase 1 to phase 50.
**Current focus:** Phase 2 -- Deep Init Questioning (executing Wave 1: Plans 01 + 02)

## Current Position

Milestone: v5.0 Context-Aware SDD
Phase: 2 of 5 (executing)
Plan: 02-01 + 02-02 complete (02-03 remaining)
Status: executing
Last activity: 2026-03-07 -- Completed 02-01 Deep init questioning building blocks (domain checklist, no-gos, research agents)

Progress: [██████░░░░] 60%

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01 | 01 | ~15min | 2 | 6 |
| Phase 01 P02 | ~10min | 2 tasks | 6 files |
| Phase 02 P02 | 2min | 2 tasks | 2 files |
| Phase 02 P01 | 5min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- **Clean slate**: All v4.x planning documents rewritten. Completed phases archived to `.planning/archive/v4/`. Roadmap renumbered from Phase 1. Previous milestone context removed from active docs to prevent context rot.
- **Context rot as first priority**: Phase 1 addresses MAXSIM's own planning document accumulation before tackling other features. Practice what we preach.
- **Phase order**: Phase 1 (rot prevention) first. Phase 2 (init) and Phase 5 (workflow gaps) can run in parallel. Phase 3 (agents) depends on Phase 2. Phase 4 (drift) depends on Phase 3.
- [Phase 02]: CONVENTIONS.md template created with 4 must-have sections: Tech Stack, File Layout, Error Handling, Testing
- [Phase 02]: PROJECT.md template expanded with Tech Stack Decisions table for research-locked choices
- [Phase 02-01]: questioning.md rewritten with 21-domain silent checklist, 80% gate, no-gos tracking -- all in-context, no runtime code
- [Phase 02-01]: Research agent enhanced with 5 mandatory output sections + web verification confidence levels
- [Phase 02-01]: Synthesizer gets locked decisions with approval gate and PROJECT.md enrichment

### Architecture

- THREE INDEPENDENT LAYERS: Claude Code standalone + Core Server (MCP) + Dashboard (optional UI)
- .mcp.json auto-discovery replaces need for session-start hook
- MCP install is optional (graceful fallback to Bash tools router)
- Skills installed at `.claude/skills/maxsim-*/SKILL.md`
- `using-maxsim` registered in AGENTS.md (not hooks)

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-07T00:05:00Z
Stopped at: Completed 02-01-PLAN.md
Resume file: None
Next action: Execute 02-03 plan (Wire templates into init workflows)
