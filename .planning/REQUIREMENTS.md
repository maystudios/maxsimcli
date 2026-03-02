# Requirements: MAXSIM

**Defined:** 2026-03-01
**Core Value:** GSD + Superpowers — structured phase-based workflow + auto-triggering skills + MCP-first Core Logic Server (Dashboard optional on top)
**Stage:** MVP (published, real users, actively evolving)

---

## v1 Requirements

### Runtime Simplification (Phases 1-2)

- [x] **SIMP-01**: Remove all non-Claude adapters — delete OpenCode, Gemini, Codex adapter code
  - Acceptance: `packages/cli/src/adapters/` contains only `claude.ts`, `base.ts`, `index.ts`
- [x] **SIMP-02**: Strip install to Claude-only flow — no runtime selection prompts
  - Acceptance: `maxsimcli` install runs without runtime selection; CLI flags `--opencode`, `--gemini`, `--codex`, `--both`, `--all` produce error
- [x] **SIMP-03**: Document removed multi-runtime architecture for future reference
  - Acceptance: `docs/multi-runtime-architecture.md` documents adapter interface and per-runtime logic
- [x] **SIMP-04**: Skills folder installed at correct location
  - Acceptance: Skills installed at `.claude/skills/` (not `.claude/agents/skills/`)
- [x] **SIMP-05**: Install code significantly reduced
  - Acceptance: Install code reduced by 30%+ in line count

### Reliability Hardening (Phase 3)

- [x] **REL-01**: STATE.md parsing handles format drift — extra blank lines, reordered sections, missing sections
  - Acceptance: STATE.md parsing handles all edge cases without breaking
- [x] **REL-02**: Actionable error messages — no unhandled stack traces in user-facing output
  - Acceptance: Every CLI command returns actionable error messages; zero unhandled stack traces
- [x] **REL-03**: Recoverable install — partial failure can be recovered by re-running
  - Acceptance: Partial install failure is recoverable by re-running install; error paths have test coverage

### Skills Infrastructure (Phase 4)

- [x] **SINF-01**: Skills installed to `.claude/skills/maxsim-*/SKILL.md` with valid frontmatter
  - Acceptance: `maxsimcli` installs skills to correct path with valid frontmatter
- [x] **SINF-02**: Skills follow Claude Code native format (frontmatter with description, context: fork, etc.)
  - Acceptance: Skills conform to Claude Code native skill format
- [x] **SINF-03**: CLI supports `skill-list`, `skill-install`, `skill-update` operations
  - Acceptance: CLI commands work for skill lifecycle management
- [x] **SINF-04**: Skills have access to MAXSIM context (STATE.md, current phase, artefakte)
  - Acceptance: Skills can access MAXSIM context via integration layer

### Core Skills (Phase 5)

- [x] **CS-01**: TDD skill enforces RED-GREEN-REFACTOR — blocks production code without failing test
  - Acceptance: TDD skill operational and enforcing the cycle
- [x] **CS-02**: Systematic Debugging skill enforces root-cause investigation before any fix (4 phases)
  - Acceptance: Debugging skill enforces investigation-first workflow
- [x] **CS-03**: Verification skill blocks success claims without fresh verification evidence
  - Acceptance: Verification skill prevents premature completion claims
- [x] **CS-04**: Code Review skill runs 2-stage review (spec compliance then code quality)
  - Acceptance: Code review skill runs both stages with actionable feedback

### Execution Skills & Pipeline (Phase 6)

- [x] **ES-01**: Simplify skill reviews changed code for reuse, quality, efficiency
  - Acceptance: Simplify skill integrates with execution pipeline
- [x] **ES-02**: Batch/Worktree skill spawns agents in isolated git worktrees
  - Acceptance: Batch skill creates worktree-based agent isolation
- [x] **ES-03**: SDD skill dispatches fresh subagent per task with 2-stage review
  - Acceptance: SDD skill operational with review between tasks
- [x] **ES-04**: Writing Plans skill produces standardized plans with TDD-style task definitions
  - Acceptance: Plans follow standardized format
- [x] **EXEC-01**: Execute-Review-Simplify-Review cycle runs for every executed feature
  - Acceptance: Full cycle operational for feature execution
- [x] **EXEC-02**: Orchestrator tracks progress via status table
  - Acceptance: Status table updated during execution
- [x] **EXEC-03**: Task-based context loading ensures agents receive only relevant files
  - Acceptance: Agents receive targeted context based on task

### Deep Discussion System (Phase 7)

- [x] **DISC-01**: New Project flow — vision, requirements, acceptance criteria, no-gos, architecture, roadmap via conversation
  - Acceptance: Full conversational flow for new projects
- [x] **DISC-02**: Init Existing flow — scan, present findings, verify with user, capture vision
  - Acceptance: Existing project onboarding without forced roadmap
- [x] **DISC-03**: Feature/Phase flow — deep discussion before plan generation
  - Acceptance: Probing questions, challenging vagueness before any plan
- [x] **DISC-04**: Todo/Bug flow — shorter collaborative discussion (20-30 min)
  - Acceptance: Collaborative discussion for smaller work items
- [x] **DISC-05**: Artefakte documents — DECISIONS.md, ACCEPTANCE-CRITERIA.md, NO-GOS.md as project-level docs
  - Acceptance: All three artefakte documents created with phase-specific extensions
- [x] **DISC-06**: Thinking partner behavior — suggestions, challenges vague answers, surfaces assumptions
  - Acceptance: Claude acts as thinking partner, not order-taker

### Artefakte System (Phase 7)

- [x] **ART-01**: DECISIONS.md created as project-level document
  - Acceptance: Decisions captured and accessible across phases
- [x] **ART-02**: ACCEPTANCE-CRITERIA.md created as project-level document
  - Acceptance: Acceptance criteria defined and tracked
- [x] **ART-03**: NO-GOS.md created as project-level document
  - Acceptance: No-gos documented to prevent scope creep
- [x] **ART-04**: Phase-specific extensions to artefakte documents
  - Acceptance: Per-phase additions appended to project-level docs

### Planning Skills (Phase 8)

- [x] **PS-01**: Brainstorming skill — hard-gate design approval, 2-3 approaches with trade-offs
  - Acceptance: Brainstorming skill enforces design exploration before approval
- [x] **PS-02**: Roadmap-Writing skill — standardized format with phases, dependencies, success criteria
  - Acceptance: Roadmap skill produces conformant roadmap format
- [x] **PS-03**: Task-based context loading for planning agents
  - Acceptance: Planning agents select relevant files based on discussion topic

### MCP Infrastructure

- [x] **MCP-01**: MAXSIM Core Server (MCP + Logic) starts via Claude Code hook OR manual command
  - Acceptance: Hook auto-starts server on session start; `/maxsim:server start` starts it manually; Claude Code can discover and call MCP tools
- [x] **MCP-02**: Phase operations via MCP — create, list, complete, insert phase with enforced directory structure
  - Acceptance: `mcp_create_phase` creates correct `.planning/phases/NN-Name/` with all required files
- [x] **MCP-03**: Task management via MCP — add, complete, list todos
  - Acceptance: `mcp_add_todo`, `mcp_complete_todo`, `mcp_list_todos` persist state correctly across calls
- [x] **MCP-04**: State management via MCP — update state, add decision, add blocker
  - Acceptance: `mcp_update_state`, `mcp_add_decision`, `mcp_add_blocker` write to STATE.md correctly
- [ ] **MCP-05**: Q&A routing via MCP — AskUserQuestion flows route to dashboard when running
  - Acceptance: Discussion-phase questions appear in dashboard Q&A panel; user answers feed back to Claude Code agent

### Dashboard (Phase 9)

- [x] **DASH-01**: Dashboard started separately from MAXSIM workflow — not auto-started by workflow commands
  - Acceptance: No workflow command auto-launches dashboard; user runs `maxsim dashboard` or connects to running Core Server
- [x] **DASH-02**: Simple Mode: current phase + progress, todo/task list, phase roadmap overview, Q&A panel
  - Acceptance: All 4 Simple Mode panels render correctly; Q&A panel shows pending questions and accepts input
- [x] **DASH-03**: Advanced Mode: everything from Simple Mode + embedded Claude Code terminal (xterm.js)
  - Acceptance: Advanced Mode has all Simple Mode panels + live terminal; switching modes preserves all state
- [x] **DASH-04**: Dashboard is an optional UI layer on top of the MAXSIM Core Server
  - Acceptance: Core Server runs standalone; Dashboard connects to running server
- [x] **DASH-05**: Mobile-responsive dashboard
  - Acceptance: Dashboard UI is usable on mobile viewports
- [x] **DASH-06**: `maxsimcli start` launches Dashboard + MCP-Server + Terminal in one command
  - Acceptance: Single command starts all three services
- [x] **DASH-07**: Multiple projects can run independent dashboards simultaneously
  - Acceptance: Project selector UI works; independent dashboard instances per project
- [x] **DISC-07**: Discussion works equally in terminal and dashboard UI
  - Acceptance: Discussion flow parity between terminal and dashboard

### Performance (Phase 10)

- [x] **PERF-01**: Hot-path I/O is non-blocking — `state-read`, `phase-list`, `roadmap-parse` complete without blocking
  - Acceptance: Async I/O on hot paths; no blocking on 50+ phase projects
- [x] **PERF-02**: Paginated phase listings for large projects
  - Acceptance: `phase-list` on 100+ directories returns paginated output; async migration passes all tests

### Quality Foundation

- [ ] **QUAL-01**: Windows brownfield detection fixed — replace Unix `find` with Node.js fs walk
  - Acceptance: `init-existing` and `new-project` correctly detect code presence on Windows
- [ ] **QUAL-02**: `output()`/`error()` moved out of core layer — core modules return typed results
  - Acceptance: Core module functions can be unit-tested without `process.exit()` side effects
- [x] **QUAL-03**: `install.ts` split into focused modules with test coverage
  - Acceptance: install.ts broken into focused modules; unit tests cover runtime selection + file copying
- [x] **QUAL-04**: Dashboard launch code consolidated — single `DashboardLauncher` shared by `cli.ts` and `install.ts`
  - Acceptance: No duplicate dashboard spawn logic; `--stop` works correctly from both entry points
- [ ] **QUAL-05**: Codebase simplification pass — YAGNI, DRY, dead code removal
  - Acceptance: No dead code paths remain; duplicated logic extracted; overall LOC reduced without losing functionality

### Superpowers Skills System

- [ ] **SKILL-01**: `using-maxsim` entry point skill — registered in AGENTS.md, triggers before any action
  - Acceptance: Skill loads at conversation start via AGENTS.md; agents check for relevant skills before responding
- [ ] **SKILL-02**: Error/pattern memory — recurring errors (2-3x occurrences) auto-saved to `.claude/memory/`
  - Acceptance: After 2-3 identical error patterns, memory file updated
- [x] **SKILL-03**: `memory-management` skill — defines when and how to save patterns, errors, decisions
  - Acceptance: Agents use skill to decide what to memorize; consistent memory format across projects
- [x] **SKILL-04**: `code-review` skill — post-phase code review
  - Acceptance: After phase completion, code-review skill triggers automatically; critical issues block phase sign-off
- [ ] **SKILL-05**: `simplify` skill — review changed code for reuse, quality, efficiency (3-reviewer upgrade)
  - Acceptance: Simplify skill spawns 3 parallel reviewers and fixes findings
- [x] **SKILL-06**: Existing skills (`systematic-debugging`, `tdd`, `verification-before-completion`) integrated into auto-trigger system
  - Acceptance: Relevant skills invoke automatically without user prompting

---

## v2 Requirements

- **MCP-06**: OpenCode runtime MCP support
- **SKILL-07**: Community skills marketplace
- **SKILL-08**: `writing-skills` skill (Superpowers-style skill authoring guide)
- **QUAL-06**: `phase insert`/`phase remove` atomic operations with rollback

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
| SIMP-01 | Phase 1 | Complete |
| SIMP-02 | Phase 2 | Complete |
| SIMP-03 | Phase 1 | Complete |
| SIMP-04 | Phase 2 | Complete |
| SIMP-05 | Phase 2 | Complete |
| REL-01 | Phase 3 | Complete |
| REL-02 | Phase 3 | Complete |
| REL-03 | Phase 3 | Complete |
| SINF-01 | Phase 4 | Complete |
| SINF-02 | Phase 4 | Complete |
| SINF-03 | Phase 4, 12 | Partial |
| SINF-04 | Phase 4 | Complete |
| CS-01 | Phase 5 | Complete |
| CS-02 | Phase 5 | Complete |
| CS-03 | Phase 5 | Complete |
| CS-04 | Phase 5 | Complete |
| ES-01 | Phase 6, 13 | Partial |
| ES-02 | Phase 6, 13 | Partial |
| ES-03 | Phase 6, 13 | Partial |
| ES-04 | Phase 6 | Complete |
| EXEC-01 | Phase 6, 13 | Partial |
| EXEC-02 | Phase 6 | Complete |
| EXEC-03 | Phase 6 | Complete |
| DISC-01 | Phase 7 | Complete |
| DISC-02 | Phase 7 | Complete |
| DISC-03 | Phase 7 | Complete |
| DISC-04 | Phase 7 | Complete |
| DISC-05 | Phase 7 | Complete |
| DISC-06 | Phase 7 | Complete |
| DISC-07 | Phase 9 | Complete |
| ART-01 | Phase 7 | Complete |
| ART-02 | Phase 7 | Complete |
| ART-03 | Phase 7 | Complete |
| ART-04 | Phase 7 | Complete |
| PS-01 | Phase 8 | Complete |
| PS-02 | Phase 8 | Complete |
| PS-03 | Phase 8 | Complete |
| MCP-01 | Phase 4 | Complete |
| MCP-02 | Phase 4 | Complete |
| MCP-03 | Phase 4 | Complete |
| MCP-04 | Phase 4 | Complete |
| MCP-05 | Phase 14 | Pending |
| DASH-01 | Phase 9 | Complete |
| DASH-02 | Phase 9 | Complete |
| DASH-03 | Phase 9 | Complete |
| DASH-04 | Phase 9 | Complete |
| DASH-05 | Phase 9 | Complete |
| DASH-06 | Phase 9 | Complete |
| DASH-07 | Phase 9, 14 | Partial |
| PERF-01 | Phase 10 | Complete |
| PERF-02 | Phase 10 | Complete |
| QUAL-01 | Phase 11 | Pending |
| QUAL-02 | Phase 11 | Pending |
| QUAL-03 | Phase 2 | Complete |
| QUAL-04 | Phase 2 | Complete |
| QUAL-05 | Phase 11 | Pending |
| SKILL-01 | Phase 12 | Pending |
| SKILL-02 | Phase 12 | Pending |
| SKILL-03 | Phase 5 | Complete |
| SKILL-04 | Phase 5 | Complete |
| SKILL-05 | Phase 13 | Pending |
| SKILL-06 | Phase 5 | Complete |
| GUARD-01 | All phases | Active |
| GUARD-02 | All phases | Active |
| GUARD-03 | All phases | Active |
| GUARD-04 | All phases | Active |

**Coverage:**
- v1 requirements: 62 total (49 complete, 6 partial, 7 pending)
- Guards: 4 total (active)
- Mapped to phases: 62
- Unmapped: 0

---

*Requirements defined: 2026-03-01*
*Traceability updated: 2026-03-02*
