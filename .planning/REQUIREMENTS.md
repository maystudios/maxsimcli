# Requirements: MAXSIM

**Defined:** 2026-03-06
**Core Value:** Every AI-assisted coding task runs with the right amount of context -- no more, no less -- producing consistent, correct output from phase 1 to phase 50.
**Stage:** MVP (published, real users, actively evolving)

---

## Active Requirements

### Context Rot Prevention

- [x] **ROT-01**: Planning documents auto-prune completed phases -- old phase data does not accumulate indefinitely in ROADMAP.md or STATE.md
- [x] **ROT-02**: A reprocess command or lifecycle hook detects and removes stale context from `.planning/` documents
- [x] **ROT-03**: Phase archival moves completed phase directories to `.planning/archive/` and strips them from active roadmap
- [x] **ROT-04**: STATE.md retains only current milestone context -- previous milestone decisions/blockers are archived, not accumulated

### Deep Init Questioning

- [x] **INIT-01**: New-project and init-existing ask comprehensive tech stack questions before generating any plan
- [x] **INIT-02**: Requirements gathering explicitly covers no-gos, hard constraints, and anti-patterns
- [x] **INIT-03**: Agentic research step investigates tech stack choices and surfaces trade-offs the user may not have considered
- [x] **INIT-04**: Generated context documents (PROJECT.md, REQUIREMENTS.md, NO-GOS.md) contain enough detail that a fresh agent can begin work without requesting clarification

### Agent Coherence

- [x] **AGENT-01**: Agent prompts reference and complement each other as a coordinated system -- no agent operates as an isolated prompt island
- [x] **AGENT-02**: Context assembly is role-aware -- each agent type receives exactly the context it needs, defined per role
- [x] **AGENT-03**: Two-stage review (spec compliance + code quality) is the standard post-task workflow, not optional
- [x] **AGENT-04**: Agent handoff protocol ensures no context is lost between agent transitions

### Spec Drift Management

- [x] **DRIFT-01**: `/maxsim:check-drift` command compares `.planning/` spec against actual codebase state
- [x] **DRIFT-02**: Drift detection identifies mismatches between planned requirements and implemented features
- [x] **DRIFT-03**: Realign-to-code path updates `.planning/` documents to reflect current codebase reality
- [x] **DRIFT-04**: Realign-to-spec path generates fix plans listing what code changes are needed to match the spec

### Missing Workflow Coverage

- [x] **FLOW-01**: Todo/bug discussion flow exists as a shorter collaborative workflow (15-20 min) for small work items
- [x] **FLOW-02**: Phase listing supports pagination for projects with 50+ phases

---

## Stability Guards

- [ ] **GUARD-01**: MUST NOT break `npx maxsimcli@latest` install flow
- [ ] **GUARD-02**: MUST NOT remove existing `/maxsim:*` command interfaces
- [ ] **GUARD-03**: MUST NOT break existing `.planning/` file format (existing projects must still work)
- [ ] **GUARD-04**: Every change must ship in the npm package (no monorepo-only features)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-runtime support (OpenCode, Gemini CLI, Codex) | Claude Code only -- simplifies codebase |
| GUI/Electron desktop app | CLI + dashboard is sufficient |
| Cloud-hosted planning service | `.planning/` stays local/git-tracked |
| Multi-user collaboration | Single-developer focus |
| Community skills marketplace | Not this milestone |
| Large module refactoring (server.ts, verify.ts) | Tech debt, not feature work |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROT-01 | Phase 1 | Complete |
| ROT-02 | Phase 1 | Complete |
| ROT-03 | Phase 1 | Complete |
| ROT-04 | Phase 1 | Complete |
| INIT-01 | Phase 2 | Complete |
| INIT-02 | Phase 2 | Complete |
| INIT-03 | Phase 2 | Complete |
| INIT-04 | Phase 2 | Complete |
| AGENT-01 | Phase 3 | Complete |
| AGENT-02 | Phase 3 | Complete |
| AGENT-03 | Phase 3 | Complete |
| AGENT-04 | Phase 3 | Complete |
| DRIFT-01 | Phase 4 | Complete |
| DRIFT-02 | Phase 4 | Complete |
| DRIFT-03 | Phase 4 | Complete |
| DRIFT-04 | Phase 4 | Complete |
| FLOW-01 | Phase 5 | Complete |
| FLOW-02 | Phase 5 | Complete |
| GUARD-01 | All | Active |
| GUARD-02 | All | Active |
| GUARD-03 | All | Active |
| GUARD-04 | All | Active |

**Coverage:**
- Active requirements: 18 total (18 complete, 0 pending)
- Guards: 4 total (active)
- Mapped to phases: 18
- Unmapped: 0

---

*Requirements defined: 2026-03-06*
