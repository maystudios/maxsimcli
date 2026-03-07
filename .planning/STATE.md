# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-08)

**Core value:** Every AI-assisted coding task runs with the right amount of context -- no more, no less -- producing consistent, correct output from phase 1 to phase 50.
**Current focus:** v5.0 milestone shipped -- planning next milestone

## Current Position

Milestone: v5.0 Context-Aware SDD (SHIPPED 2026-03-08)
Phase: All phases complete
Plan: 14/14 plans complete across 5 phases
Status: shipped
Last activity: 2026-03-08 -- Milestone v5.0 archived

Progress: [██████████] 100%

## Accumulated Context

### Decisions

None (cleared at milestone completion -- see milestones/v5.0-ROADMAP.md for v5.0 decisions).

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

Last session: 2026-03-08
Stopped at: v5.0 milestone archived
Resume file: None
Next action: Run `/maxsim:new-milestone` to start next milestone
