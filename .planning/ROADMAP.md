# Roadmap: MAXSIM

## Overview

MAXSIM v2.0 is built on three pillars: deep collaborative planning, context engineering, and superior execution. The roadmap: clean up multi-runtime code, harden reliability, build the skills infrastructure, ship 10 native skills (core, execution, planning), redesign the discussion system, overhaul the dashboard, and optimize performance. Big bang release — all phases complete before v2.0 tag.

## Milestones

- 🚧 **v2.0 Claude Code Edition** — Phases 1-10 (in progress)

## Phases

- [x] **Phase 1: Runtime Cleanup** - Remove all non-Claude adapters and document architecture (completed 2026-03-02)
- [x] **Phase 2: Install Simplification** - Strip to clean Claude-only install flow (completed 2026-03-02)
- [x] **Phase 3: Reliability Hardening** - STATE.md parsing, error handling, install recovery (completed 2026-03-02)
- [x] **Phase 4: Skills Infrastructure** - Build native .claude/skills/ system with install pipeline
- [x] **Phase 5: Core Skills** - TDD, Systematic Debugging, Verification-Before-Completion, Code Review (2-stage)
- [x] **Phase 6: Execution Skills & Pipeline** - Simplify, Batch/Worktree, SDD, Writing Plans + Execute→Review→Simplify cycle
- [x] **Phase 7: Deep Discussion System** - 4 collaborative flows + expanded artefakte (DECISIONS.md, ACCEPTANCE-CRITERIA.md, NO-GOS.md) (completed 2026-03-02)
- [x] **Phase 8: Planning Skills** - Brainstorming, Roadmap-Writing + task-based context loading (completed 2026-03-02)
- [x] **Phase 9: Dashboard Overhaul** - Unified mode, MCP Q&A, maxsimcli start, multi-project (completed 2026-03-02)
- [x] **Phase 10: Performance** - Async hot-path I/O, paginated phase listings (completed 2026-03-02)

## Phase Details

### Phase 1: Runtime Cleanup
**Goal**: All non-Claude runtime code removed; architecture documented for future reference
**Depends on**: Nothing (first phase)
**Requirements**: SIMP-01, SIMP-03
**Success Criteria** (what must be TRUE):
  1. `packages/cli/src/adapters/` contains only `claude.ts`, `base.ts`, `index.ts`
  2. `docs/multi-runtime-architecture.md` documents adapter interface and per-runtime logic
  3. `npm run build` succeeds and `npm test` passes after removal
  4. No references to OpenCode, Gemini, or Codex remain in source code
**Plans**: TBD

### Phase 2: Install Simplification
**Goal**: Install is a clean single-path Claude Code flow with no runtime selection
**Depends on**: Phase 1
**Requirements**: SIMP-02, SIMP-04, SIMP-05
**Success Criteria** (what must be TRUE):
  1. `maxsimcli` install runs without runtime selection prompts
  2. CLI flags `--opencode`, `--gemini`, `--codex`, `--both`, `--all` produce error if used
  3. Skills folder installed at `.claude/skills/` (not `.claude/agents/skills/`)
  4. Install code reduced by 30%+ in line count
**Plans**: TBD

### Phase 3: Reliability Hardening
**Goal**: Core CLI is robust — no silent failures, no format-drift crashes, recoverable installs
**Depends on**: Phase 2
**Requirements**: REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. STATE.md parsing handles extra blank lines, reordered sections, missing sections without breaking
  2. Every CLI command returns actionable error messages — zero unhandled stack traces in user-facing output
  3. Partial install failure is recoverable by re-running install
  4. Error paths have test coverage
**Plans**: TBD

### Phase 4: Skills Infrastructure
**Goal**: Native skills system built — install, update, list skills in `.claude/skills/` format
**Depends on**: Phase 2
**Requirements**: SINF-01, SINF-02, SINF-03, SINF-04
**Success Criteria** (what must be TRUE):
  1. `maxsimcli` installs skills to `.claude/skills/maxsim-*/SKILL.md` with valid frontmatter
  2. Skills follow Claude Code native format (frontmatter with description, context: fork, etc.)
  3. CLI supports `skill-list`, `skill-install`, `skill-update` operations
  4. Skills have access to MAXSIM context (STATE.md, current phase, artefakte) via integration layer
**Plans**: TBD

### Phase 5: Core Skills
**Goal**: Four discipline-enforcing skills shipped — TDD, debugging, verification, code review
**Depends on**: Phase 4
**Requirements**: CS-01, CS-02, CS-03, CS-04
**Success Criteria** (what must be TRUE):
  1. TDD skill enforces RED→GREEN→REFACTOR — blocks production code without failing test
  2. Systematic Debugging skill enforces root-cause investigation before any fix attempt (4 phases)
  3. Verification skill blocks success claims without fresh verification evidence
  4. Code Review skill runs 2-stage review (spec compliance → code quality) with actionable feedback
  5. All skills integrated with MAXSIM STATE.md and phase tracking
**Plans**: TBD

### Phase 6: Execution Skills & Pipeline
**Goal**: Execution pipeline redesigned with Simplify, Batch, SDD skills and Execute→Review→Simplify cycle
**Depends on**: Phase 5
**Requirements**: ES-01, ES-02, ES-03, ES-04, EXEC-01, EXEC-02, EXEC-03
**Success Criteria** (what must be TRUE):
  1. Simplify skill spawns 3 parallel reviewers (code reuse, quality, efficiency) and fixes findings
  2. Batch/Worktree skill spawns 5-30 agents, each in isolated git worktree with own PR
  3. SDD skill dispatches fresh subagent per task with 2-stage review between tasks
  4. Writing Plans skill produces standardized plans with TDD-style task definitions
  5. Execute → Review → Simplify → Review cycle runs for every executed feature
  6. Orchestrator tracks progress via status table
  7. Task-based context loading ensures agents receive only relevant files
**Plans**: TBD

### Phase 7: Deep Discussion System
**Goal**: All four planning modes rewritten for deep collaborative discussion with user
**Depends on**: Phase 4
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, ART-01, ART-02, ART-03, ART-04
**Success Criteria** (what must be TRUE):
  1. New Project flow takes user through vision → requirements → acceptance criteria → no-gos → architecture → roadmap via free-flowing conversation
  2. Init Existing flow scans, presents findings, asks user to verify/correct, captures vision — without forcing a roadmap
  3. Feature/Phase flow deeply discusses what's needed before generating any plan — probing questions, challenging vagueness
  4. Todo/Bug flow runs a shorter but still collaborative discussion (20-30 min)
  5. DECISIONS.md, ACCEPTANCE-CRITERIA.md, NO-GOS.md created as project-level documents with phase-specific extensions
  6. Claude acts as thinking partner — suggests directions, challenges vague answers, surfaces unstated assumptions
**Plans**: TBD

### Phase 8: Planning Skills
**Goal**: Brainstorming and Roadmap-Writing skills shipped with intelligent context loading
**Depends on**: Phase 7
**Requirements**: PS-01, PS-02, PS-03
**Success Criteria** (what must be TRUE):
  1. Brainstorming skill enforces hard-gate design approval — explores context, proposes 2-3 approaches with trade-offs, documents decisions
  2. Roadmap-Writing skill produces standardized roadmap format with phases, dependencies, success criteria
  3. Planning agents intelligently select relevant files based on discussion topic (task-based context loading)
**Plans**: TBD

### Phase 9: Dashboard Overhaul
**Goal**: Dashboard is unified discussion + execution UI with `maxsimcli start` and multi-project support
**Depends on**: Phase 7
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DISC-07
**Success Criteria** (what must be TRUE):
  1. `maxsimcli start` launches Dashboard + MCP-Server + Terminal in one command
  2. Single unified mode — discussion/Q&A UI is primary, terminal is toggle-able panel
  3. MCP-powered Q&A interface handles discussion questions from Claude Code
  4. Multiple projects can run independent dashboards simultaneously
  5. Health check handles up to 10s startup; file watcher debounced for bulk edits
  6. Discussion works equally in terminal and dashboard UI
**Plans**: TBD

### Phase 10: Performance
**Goal**: Hot-path I/O is non-blocking, large projects don't hang
**Depends on**: Phase 6
**Requirements**: PERF-01, PERF-02
**Success Criteria** (what must be TRUE):
  1. `state-read`, `phase-list`, `roadmap-parse` complete without blocking on 50+ phase projects
  2. `phase-list` on 100+ directories returns paginated output
  3. Async migration passes all existing tests
**Plans**: TBD

## Progress

**Execution Order:**
Phase 1 → Phase 2 → Phase 3 ∥ Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Runtime Cleanup | 1/1 | Complete | 2026-03-02 |
| 2. Install Simplification | 1/1 | Complete | 2026-03-02 |
| 3. Reliability Hardening | 1/1 | Complete | 2026-03-02 |
| 4. Skills Infrastructure | 1/1 | Complete | 2026-03-02 |
| 5. Core Skills | 1/1 | Complete | 2026-03-02 |
| 6. Execution Skills & Pipeline | 1/1 | Complete | 2026-03-02 |
| 7. Deep Discussion System | 1/1 | Complete | 2026-03-02 |
| 8. Planning Skills | 1/1 | Complete | 2026-03-02 |
| 9. Dashboard Overhaul | 1/1 | Complete | 2026-03-02 |
| 10. Performance | 1/1 | Complete | 2026-03-02 |
