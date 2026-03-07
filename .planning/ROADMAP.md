# Roadmap: MAXSIM

## Overview

MAXSIM is a working product with 35+ commands, 13 agents, 11 skills, and a dashboard. This milestone focuses on what MAXSIM doesn't do yet: prevent its own context rot, ask deep enough questions during init, coordinate agents as a system, detect spec drift, and fill workflow gaps. Five phases, clean numbering, no legacy baggage.

## Milestone

- [ ] **v5.0 Context-Aware SDD** -- Phases 1-5 (active)

## Phases

- [x] **Phase 1: Context Rot Prevention** - Auto-prune completed phases, archive stale context, keep planning docs focused on current work
- [x] **Phase 2: Deep Init Questioning** - Comprehensive onboarding with tech stack research, constraints, and no-go gathering
- [ ] **Phase 3: Agent Coherence** - Coordinated agent prompt system with role-aware context and standard two-stage review
- [ ] **Phase 4: Spec Drift Management** - `/maxsim:check-drift` command that compares spec to codebase and generates realignment plans
- [ ] **Phase 5: Workflow Coverage** - Todo/bug discussion flow and phase listing pagination

## Phase Details

### Phase 1: Context Rot Prevention
**Goal**: MAXSIM actively prevents context accumulation in its own planning documents -- completed phases are archived, stale state is pruned, and active docs contain only current-milestone context
**Depends on**: Nothing (first phase)
**Requirements**: ROT-01, ROT-02, ROT-03, ROT-04
**Success Criteria** (what must be TRUE):
  1. Completing a milestone archives its phase directories to `.planning/archive/<milestone>/` and removes them from ROADMAP.md
  2. STATE.md is reset to current-milestone context on milestone transition -- previous decisions/blockers moved to archive
  3. A reprocess command or hook detects planning documents with stale phase references and offers cleanup
  4. ROADMAP.md for a 50-phase project contains only the active milestone's phases, not all historical phases
**Plans**: 2 plans in 2 waves
  - [x] 01-01: Phase archive sweep (ROT-01, ROT-03) — Wave 1
  - [x] 01-02: Stale detection + milestone reset (ROT-02, ROT-04) — Wave 2

### Phase 2: Deep Init Questioning
**Goal**: New-project and init-existing produce context documents thorough enough that any agent can start work without asking follow-up questions
**Depends on**: Nothing (independent)
**Requirements**: INIT-01, INIT-02, INIT-03, INIT-04
**Success Criteria** (what must be TRUE):
  1. Init flows ask explicit questions about tech stack, libraries, and tooling choices before generating any plan
  2. Both flows surface and document no-gos, hard constraints, and anti-patterns as named artefakte before planning begins
  3. An agentic research step investigates tech stack choices and surfaces trade-offs the user may not have considered
  4. A fresh agent subcontext receiving only PROJECT.md + REQUIREMENTS.md + NO-GOS.md can begin a task without requesting clarification
**Plans**: 3 plans in 2 waves
  - [x] 02-01: Questioning depth + no-gos + research agents (INIT-01, INIT-02, INIT-03) — Wave 1
  - [x] 02-02: CONVENTIONS.md + PROJECT.md templates (INIT-04) — Wave 1
  - [x] 02-03: Workflow integration + CLI wiring (INIT-01, INIT-02, INIT-03, INIT-04) — Wave 2

### Phase 3: Agent Coherence
**Goal**: Agents operate as a coordinated system -- prompts complement each other, context is role-targeted, and two-stage review is the default post-task workflow
**Depends on**: Phase 2 (agents need thorough init context to test coherence)
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04
**Success Criteria** (what must be TRUE):
  1. Each agent prompt explicitly references which other agents it hands off to and what context it passes
  2. Context assembly per agent role is defined: executor gets task + relevant code; reviewer gets spec + diff; planner gets roadmap + requirements
  3. Two-stage review (spec compliance then code quality) runs automatically after every task completion
  4. Agent handoff points are documented and implemented -- context loss between agent transitions is eliminated
**Plans**: 4 plans in 2 waves
  - [x] 03-01: Agent coherence - core agents (AGENT-01, AGENT-04) — Wave 1
  - [x] 03-02: Agent coherence - support agents + registry (AGENT-01, AGENT-04) — Wave 1
  - [ ] 03-03: CLI init commands + frontmatter schema (AGENT-02) — Wave 2
  - [ ] 03-04: Two-stage review enforcement (AGENT-03) — Wave 2

### Phase 4: Spec Drift Management
**Goal**: Users can detect and correct divergence between `.planning/` spec and actual codebase state using a single command
**Depends on**: Phase 3 (agents must be coherent to generate reliable drift reports)
**Requirements**: DRIFT-01, DRIFT-02, DRIFT-03, DRIFT-04
**Success Criteria** (what must be TRUE):
  1. `/maxsim:check-drift` produces a report comparing planned requirements to implemented features
  2. The drift report identifies specific mismatches: requirements marked complete but not implemented, and implemented features not captured in `.planning/`
  3. User can invoke realign-to-code path that updates `.planning/` to reflect current codebase
  4. User can invoke realign-to-spec path that generates a fix plan for what code changes are needed
**Plans**: 3 plans in 2 waves
  - [ ] 04-01: Drift core module + types + CLI wiring (DRIFT-01, DRIFT-02) — Wave 1
  - [ ] 04-02: Drift-checker agent + check-drift command/workflow (DRIFT-01, DRIFT-02) — Wave 2
  - [ ] 04-03: Realign command + workflow (DRIFT-03, DRIFT-04) — Wave 2

### Phase 5: Workflow Coverage
**Goal**: Fill the two verified gaps in workflow coverage -- todo/bug discussion flow and phase listing pagination
**Depends on**: Nothing (independent)
**Requirements**: FLOW-01, FLOW-02
**Success Criteria** (what must be TRUE):
  1. `/maxsim:discuss-todo` or equivalent command runs a shorter collaborative discussion (15-20 min) for small work items and bugs
  2. `phase-list` command supports pagination for projects with 50+ phases -- returns chunked output with offset/limit
**Plans**: TBD

## Progress

**Execution Order:**
Phase 1 -> Phase 2 || Phase 5 -> Phase 3 -> Phase 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Context Rot Prevention | 2/2 | Complete | 2026-03-06 |
| 2. Deep Init Questioning | 3/3 | Complete | 2026-03-07 |
| 3. Agent Coherence | 2/4 | In Progress | - |
| 4. Spec Drift Management | 0/3 | Not started | - |
| 5. Workflow Coverage | 0/? | Not started | - |
