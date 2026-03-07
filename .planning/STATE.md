# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Every AI-assisted coding task runs with the right amount of context -- no more, no less -- producing consistent, correct output from phase 1 to phase 50.
**Current focus:** All 5 phases complete -- milestone v5.0 ready for completion

## Current Position

Milestone: v5.0 Context-Aware SDD
Phase: 5 of 5 (all complete)
Plan: All plans complete (14/14 across 5 phases)
Status: complete
Last activity: 2026-03-08 -- Spec realigned to match codebase

Progress: [██████████] 100%

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01 | 01 | ~15min | 2 | 6 |
| Phase 01 P02 | ~10min | 2 tasks | 6 files |
| Phase 02 P02 | 2min | 2 tasks | 2 files |
| Phase 02 P01 | 5min | 2 tasks | 4 files |
| Phase 02 P03 | 6min | 2 tasks | 3 files |
| Phase 03 P01 | 7min | 2 tasks | 7 files |
| Phase 03 P02 | 7min | 2 tasks | 7 files |
| Phase 03 P01 | 7min | 2 tasks | 7 files |
| Phase 03 P04 | 7min | 2 tasks | 3 files |
| Phase 03 P03 | 11min | 2 tasks | 5 files |
| Phase 04 P01 | 10min | 2 tasks | 7 files |
| Phase 04 P03 | 3min | 2 tasks | 2 files |
| Phase 04 P02 | 6min | 2 tasks | 4 files |
| Phase 05 P01 | 4min | 2 tasks | 2 files |
| Phase 05 P02 | 6min | 2 tasks | 3 files |

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
- [Phase 02-03]: Both init workflows now have agent dry-run validation as final quality gate
- [Phase 02-03]: init.ts conventions_path added to PlanPhaseContext and PhaseOpContext (existence-checked)
- [Phase 02-03]: Stack preference questions filter to framework-level only, capped at 8-10 items
- [Phase 03]: Support agents (verifier, spec-reviewer, code-reviewer, debugger, codebase-mapper, integration-checker) all have system map, contracts, validation, deferred items, needs frontmatter
- [Phase 03]: AGENTS.md documents Agent Coherence Conventions: system map maintenance, required sections, needs vocabulary (9 keys), handoff contract
- [Phase 03]: Reviewer agents output YAML frontmatter (status, critical_count, warning_count) for machine-parseable PASS/FAIL detection
- [Phase 03-01]: 7 core agents (executor, planner, plan-checker, phase-researcher, project-researcher, research-synthesizer, roadmapper) have system map, upstream/downstream contracts, input validation, deferred items protocol, needs frontmatter, minimum handoff contract
- [Phase 03]: [Phase 03-01]: 7 core agents (executor, planner, plan-checker, phase-researcher, project-researcher, research-synthesizer, roadmapper) have system map, upstream/downstream contracts, input validation, deferred items protocol, needs frontmatter, minimum handoff contract
- [Phase 03]: Universal two-stage review (spec + code) runs unconditionally on all model profiles, including quick tasks and gap-closure plans
- [Phase 03]: Agent-level init commands (executor, planner, researcher, verifier, debugger) are additions alongside existing workflow-level inits, with role-filtered context and codebase docs
- [Phase 03]: Review frontmatter schema (status, critical_count, warning_count) added for machine-parseable reviewer output validation
- [Phase 04]: Drift-checker agent uses verifier-tier model profile (sonnet/balanced, haiku/budget). drift.ts core module provides 6 synchronous cmd* functions for report CRUD and spec extraction.
- [Phase 04]: Realign workflow is an interactive orchestrator (not agent spawn) because it requires per-item user decisions for to-code and user approval of phase groupings for to-spec
- [Phase 04]: Drift-checker agent uses 5-pass multi-pass protocol (spec extraction, codebase analysis, no-go/convention check, archived regression check, synthesis) to prevent context overload. Workflow reads only frontmatter from generated report.
- [Phase 05]: [Phase 05-01]: /maxsim:discuss command + workflow created as superset router -- triages unknown items via AskUserQuestion adaptive discussion, routes to existing todo/phase creation tools, never auto-routes without user confirmation
- [Phase 05]: Page size 20 phases for MCP and workflow pagination; pagination only engages when total > 20; metrics truncation display-only

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
Stopped at: Spec realigned to match codebase (all phases verified)
Resume file: None
Next action: Run `/maxsim:complete-milestone` to archive v5.0 and start next milestone
