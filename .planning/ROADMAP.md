# Roadmap: MAXSIM
## Milestone: MCP Foundation + Superpowers Skills

## Overview

MAXSIM evolves from a GSD-only workflow system into a GSD + Superpowers platform with an MCP-first architecture. This milestone delivers:
1. A **MAXSIM Core Server** (MCP tools + logic, always-on background server) -- Claude Code calls tools instead of reading Bash output
2. A **Quality Foundation** -- testable core, Windows fixes, consolidated codebase
3. A **Superpowers Skills System** -- auto-triggering skills, error memory, code review
4. A **Dashboard Evolution** -- Simple Mode (task overview + Q&A) + Advanced Mode (terminal), running on top of Core Server

**Architecture direction:** Core Server is the new backbone. Dashboard is an optional UI layer on top. Bash tools router stays for backwards compatibility and quick agent calls.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: MCP Core Server** - MAXSIM Core Server with MCP tools for phase ops, task management, and state updates
- [ ] **Phase 2: Quality Foundation** - Windows fix, testable core, install.ts refactor, dashboard launch consolidation
- [ ] **Phase 3: Skills System** - using-maxsim entry skill, error memory, new skills (memory-management, code-review, simplify)
- [ ] **Phase 4: Dashboard Evolution** - Core Server as backend, Simple Mode (4 panels), Advanced Mode (+ terminal), Q&A routing

## Phase Details

### Phase 1: MCP Core Server
**Goal**: A persistent MAXSIM Core Server that Claude Code can call via MCP tools for all structured operations -- phase creation, task management, state updates
**Depends on**: Nothing (first phase)
**Requirements**: MCP-01, MCP-02, MCP-03, MCP-04
**Success Criteria** (what must be TRUE):
  1. Running `maxsim-tools.cjs start-server` spawns a persistent MCP server; `.mcp.json` at project root enables Claude Code to auto-discover and connect to it at session start
  2. `mcp_create_phase` creates a correctly structured `.planning/phases/NN-Name/` directory with all required files -- identical result every time, no variance
  3. `mcp_add_todo`, `mcp_complete_todo`, `mcp_list_todos` persist task state correctly; `mcp_update_state`, `mcp_add_decision`, `mcp_add_blocker` write to STATE.md correctly
  4. Existing `/maxsim:*` commands and Bash tools router continue to work without any changes
  5. `.mcp.json` written during install configures the MCP server for auto-start; Claude Code natively spawns stdio servers from `.mcp.json` at session start
  6. When MCP server is unavailable, workflows warn the user and fall back to Bash tools router

**Plans:** 4 plans

Plans:
- [ ] 01-01-PLAN.md -- MCP server infrastructure + phase CRUD tools
- [ ] 01-02-PLAN.md -- Todo + state management MCP tools
- [ ] 01-03-PLAN.md -- Install integration + .mcp.json + fallback + end-to-end verification
- [ ] 01-04-PLAN.md -- Gap closure: scaffold CONTEXT.md + RESEARCH.md in mcp_create_phase/mcp_insert_phase

### Phase 2: Quality Foundation
**Goal**: Testable core architecture and cross-platform reliability -- clean foundation for Phase 3+4
**Depends on**: Phase 1 (dashboard launch consolidation targets Core Server architecture)
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05
**Success Criteria** (what must be TRUE):
  1. `init-existing` and `new-project` correctly detect existing code on Windows (no Unix `find` dependency)
  2. Core module functions return typed results instead of calling `process.exit()` -- unit tests run without mocking process.exit
  3. `install.ts` split into focused modules (`install/adapters.ts`, `install/dashboard.ts`, `install/hooks.ts`) with unit tests covering runtime selection and file copying
  4. Dashboard launch logic exists in exactly one place; `--stop` works correctly from both `cli.ts` and `install.ts`
  5. Dead code removed, duplicated logic consolidated (YAGNI/DRY pass); hand-rolled code replaced by proven libraries where applicable; `nyquist_validation` stub removed; Brave search key detection consolidated into one helper

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Skills System
**Goal**: Agents automatically invoke relevant skills before acting; new skills for memory, code review, and simplification; error patterns are remembered
**Depends on**: Phase 1 (skills may use MCP for state persistence)
**Requirements**: SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05, SKILL-06
**Success Criteria** (what must be TRUE):
  1. `using-maxsim` skill is registered in AGENTS.md and triggers before any agent action in a MAXSIM project
  2. After 2-3 occurrences of the same error pattern, it is auto-saved to `.claude/memory/` and visible in subsequent agent context
  3. `memory-management`, `code-review`, and `simplify` skills exist in `templates/skills/` and are included in MAXSIM install
  4. Existing skills (`systematic-debugging`, `tdd`, `verification-before-completion`) trigger automatically via AGENTS.md without user prompting
  5. `code-review` skill triggers after each phase completion; critical issues block phase sign-off

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Dashboard Evolution
**Goal**: Dashboard as optional UI on top of Core Server -- Simple Mode (4 panels: phase, todos, roadmap, Q&A) + Advanced Mode (+ terminal)
**Depends on**: Phase 1 (Core Server required), Phase 2 (consolidated launch code)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, MCP-05
**Success Criteria** (what must be TRUE):
  1. Dashboard only starts via explicit `maxsim dashboard` command -- no workflow command auto-launches it
  2. Simple Mode renders: current phase + progress bar, todo list (done/not-done), phase roadmap overview, Q&A panel for pending questions
  3. Advanced Mode has all Simple Mode panels plus embedded xterm.js terminal showing a live Claude Code session
  4. Switching between Simple and Advanced modes preserves all state (Advanced = Simple + terminal pane, not a different layout)
  5. When dashboard is running, AskUserQuestion calls route via MCP to the Q&A panel; user answers feed back to the agent
  6. Dashboard connects to a running Core Server; starting dashboard also ensures Core Server is running

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

## Progress

**Execution Order:**
Phases execute in order: 1 -> 2 -> 3 -> 4
(Phase 2 and Phase 3 can partially overlap after Phase 1 completes)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. MCP Core Server | 1/3 | In progress | - |
| 2. Quality Foundation | 0/3 | Not started | - |
| 3. Skills System | 0/2 | Not started | - |
| 4. Dashboard Evolution | 0/3 | Not started | - |
