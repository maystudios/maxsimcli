# Requirements: MAXSIM

**Defined:** 2026-03-01
**Core Value:** GSD + Superpowers — structured phase-based workflow + auto-triggering skills + MCP-first Core Logic Server (Dashboard optional on top)
**Stage:** MVP (published, real users, actively evolving)

---

## v1 Requirements

### MCP Infrastructure

- [x] **MCP-01**: MAXSIM Core Server (MCP + Logic) starts via Claude Code hook OR manual command — Claude Code can call MAXSIM tools as MCP tool calls
  - Acceptance: Hook auto-starts server on session start; `/maxsim:server start` starts it manually; Claude Code can discover and call MCP tools
- [x] **MCP-02**: Phase operations via MCP — create, list, complete, insert phase with enforced directory structure
  - Acceptance: `mcp_create_phase` creates correct `.planning/phases/NN-Name/` with all required files; no free-form AI writes for phase structure
- [x] **MCP-03**: Task management via MCP — add, complete, list todos
  - Acceptance: `mcp_add_todo`, `mcp_complete_todo`, `mcp_list_todos` persist state correctly across calls
- [x] **MCP-04**: State management via MCP — update state, add decision, add blocker
  - Acceptance: `mcp_update_state`, `mcp_add_decision`, `mcp_add_blocker` write to STATE.md correctly
- [ ] **MCP-05**: Q&A routing via MCP — AskUserQuestion flows route to dashboard when running
  - Acceptance: Discussion-phase questions appear in dashboard Q&A panel; user answers feed back to Claude Code agent

### Quality Foundation

- [ ] **QUAL-01**: Windows brownfield detection fixed — replace Unix `find` with Node.js fs walk
  - Acceptance: `init-existing` and `new-project` correctly detect code presence on Windows
- [ ] **QUAL-02**: `output()`/`error()` moved out of core layer — core modules return typed results
  - Acceptance: Core module functions can be unit-tested without `process.exit()` side effects
- [ ] **QUAL-03**: `install.ts` split into focused modules with test coverage
  - Acceptance: install.ts broken into `install/adapters.ts`, `install/dashboard.ts`, `install/hooks.ts` etc.; unit tests cover runtime selection + file copying
- [ ] **QUAL-04**: Dashboard launch code consolidated — single `DashboardLauncher` shared by `cli.ts` and `install.ts`
  - Acceptance: No duplicate dashboard spawn logic; `--stop` works correctly from both entry points
- [ ] **QUAL-05**: Codebase simplification pass — YAGNI, DRY, dead code removal, replace hand-rolled code with proven libraries where applicable
  - Acceptance: No dead code paths remain; duplicated logic extracted into shared helpers or replaced by library calls; Brave search key detection consolidated; `nyquist_validation` stub removed; overall LOC reduced without losing functionality

### Superpowers Skills System

- [ ] **SKILL-01**: `using-maxsim` entry point skill — registered in AGENTS.md, establishes skill-usage rules, triggers before any action
  - Acceptance: Skill loads at conversation start via AGENTS.md; agents check for relevant skills before responding
- [ ] **SKILL-02**: Error/pattern memory — recurring errors (2-3x occurrences) auto-saved to `.claude/memory/`
  - Acceptance: After 2-3 identical error patterns, memory file updated; agents see the note in subsequent context
- [ ] **SKILL-03**: `memory-management` skill — defines when and how to save patterns, errors, decisions
  - Acceptance: Agents use skill to decide what to memorize; consistent memory format across projects
- [ ] **SKILL-04**: `code-review` skill — post-phase code review (Superpowers-style requesting-code-review)
  - Acceptance: After phase completion, code-review skill triggers automatically; critical issues block phase sign-off
- [ ] **SKILL-05**: `simplify` skill — review changed code for reuse, quality, efficiency
  - Acceptance: Skill integrates with existing simplify workflow; triggers after implementation complete
- [ ] **SKILL-06**: Existing skills (`systematic-debugging`, `tdd`, `verification-before-completion`) integrated into auto-trigger system via AGENTS.md
  - Acceptance: Relevant skills invoke automatically without user prompting

### Dashboard Evolution

- [ ] **DASH-01**: Dashboard started separately from MAXSIM workflow — not auto-started by workflow commands
  - Acceptance: No workflow command auto-launches dashboard; user runs `maxsim dashboard` or connects to running Core Server
- [ ] **DASH-02**: Simple Mode: current phase + progress, todo/task list (done/not-done), phase roadmap overview, Q&A panel
  - Acceptance: All 4 Simple Mode panels render correctly; Q&A panel shows pending questions and accepts input
- [ ] **DASH-03**: Advanced Mode: everything from Simple Mode + embedded Claude Code terminal (xterm.js)
  - Acceptance: Advanced Mode has all Simple Mode panels + live terminal; switching modes preserves all state
- [ ] **DASH-04**: Dashboard is an optional UI layer on top of the MAXSIM Core Server
  - Acceptance: Core Server runs standalone (no dashboard); Dashboard connects to running server; Dashboard start also ensures Core Server is running

---

## v2 Requirements

- **MCP-06**: OpenCode runtime MCP support
- **SKILL-07**: Community skills marketplace
- **SKILL-08**: `writing-skills` skill (Superpowers-style skill authoring guide)
- **DASH-05**: Mobile-responsive dashboard
- **QUAL-05**: `phase insert`/`phase remove` atomic operations with rollback
- **PERF-01**: Dashboard/server PID file to replace port-scanning on every invocation

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sprint ceremonies, story points | Not enterprise theater — GSD philosophy |
| Multi-user collaboration | Single-developer focus for v1 |
| Cloud/hosted state | Local filesystem is the source of truth |
| Gemini/Codex MCP | Claude Code first, other runtimes are phased |

---

## Stability Guards

- [ ] **GUARD-01**: MUST NOT break `npx maxsimcli@latest` install flow
- [ ] **GUARD-02**: MUST NOT remove existing `/maxsim:*` command interfaces
- [ ] **GUARD-03**: MUST NOT break existing `.planning/` file format (existing projects must still work)
- [ ] **GUARD-04**: Every change must ship in the npm package (no monorepo-only features)

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MCP-01 | Phase 1 | Complete |
| MCP-02 | Phase 1 | Complete |
| MCP-03 | Phase 1 | Complete |
| MCP-04 | Phase 1 | Complete |
| MCP-05 | Phase 4 | Pending |
| QUAL-01 | Phase 2 | Pending |
| QUAL-02 | Phase 2 | Pending |
| QUAL-03 | Phase 2 | Pending |
| QUAL-04 | Phase 2 | Pending |
| QUAL-05 | Phase 2 | Pending |
| SKILL-01 | Phase 3 | Pending |
| SKILL-02 | Phase 3 | Pending |
| SKILL-03 | Phase 3 | Pending |
| SKILL-04 | Phase 3 | Pending |
| SKILL-05 | Phase 3 | Pending |
| SKILL-06 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| GUARD-01 | All phases | Active |
| GUARD-02 | All phases | Active |
| GUARD-03 | All phases | Active |
| GUARD-04 | All phases | Active |

**Coverage:**
- v1 requirements: 20 total
- Guards: 4 total
- Mapped to phases: 20
- Unmapped: 0

---

*Requirements defined: 2026-03-01*
