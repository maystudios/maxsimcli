# Requirements: MAXSIM

**Defined:** 2026-03-01 | **Refined:** 2026-03-02
**Core Value:** Deep collaborative planning + context engineering + superior execution
**Stage:** v2.0 — Claude Code Edition
**Release:** Big bang (all phases complete before v2.0 tag)

## v2 Requirements

### Simplification (Runtime Cleanup)

- [ ] **SIMP-01**: All non-Claude runtime adapters removed from codebase
- [ ] **SIMP-02**: Install flow has zero runtime selection — Claude Code only
- [ ] **SIMP-03**: Multi-runtime architecture documented in `docs/` before removal
- [ ] **SIMP-04**: Skills folder moved from `.claude/agents/skills/` to `.claude/skills/`
- [ ] **SIMP-05**: CLI flags `--opencode`, `--gemini`, `--codex`, `--both`, `--all` removed

### Reliability

- [ ] **REL-01**: STATE.md parsing handles format drift without breaking
- [ ] **REL-02**: CLI commands return actionable error messages — no stack traces
- [ ] **REL-03**: Install recovery from partial failures

### Skills Infrastructure

- [ ] **SINF-01**: Skills install pipeline copies skills to `.claude/skills/maxsim-*/SKILL.md`
- [ ] **SINF-02**: Skills follow Claude Code's native format (frontmatter, context: fork, etc.)
- [ ] **SINF-03**: Skills registry in CLI for install/update/list operations
- [ ] **SINF-04**: Skills deeply integrated with MAXSIM (STATE.md access, phase awareness, artefakte references)

### Core Skills

- [ ] **CS-01**: TDD Skill — RED/GREEN/REFACTOR cycle enforced, no production code without failing test first
- [ ] **CS-02**: Systematic Debugging Skill — Root cause investigation before any fix attempt, 4 mandatory phases
- [ ] **CS-03**: Verification-Before-Completion Skill — No success claims without fresh verification evidence
- [ ] **CS-04**: Code Review Skill — Two-stage review: spec compliance first, then code quality. Push back on incorrect feedback

### Execution Skills

- [ ] **ES-01**: Simplify Skill — 3 parallel reviewers (code reuse, quality, efficiency), modeled after Claude's /simplify
- [ ] **ES-02**: Batch/Worktree Execution Skill — 5-30 agents in isolated worktrees, each with own PR, modeled after Claude's /batch
- [ ] **ES-03**: Subagent-Driven Development Skill — Fresh subagent per task with two-stage review between tasks
- [ ] **ES-04**: Writing Plans Skill — Standardized plan format with TDD-style task definitions

### Execution Pipeline

- [ ] **EXEC-01**: Execute → Review → Simplify → Review cycle for every feature
- [ ] **EXEC-02**: Orchestrator tracks progress with status table, aggregates results
- [ ] **EXEC-03**: Task-based context loading — agents receive only files/sections relevant to their assignment

### Deep Discussion System

- [ ] **DISC-01**: New Project flow — full collaborative planning (vision → requirements → architecture → roadmap), can take 1+ hour of back-and-forth
- [ ] **DISC-02**: Init Existing flow — scan, verify with user, capture vision and direction (no roadmap forced)
- [ ] **DISC-03**: Feature/Phase flow — deep discussion to fully specify what's needed before any planning
- [ ] **DISC-04**: Todo/Bug flow — shorter collaborative discussion (20-30 min) with lighter documentation
- [ ] **DISC-05**: Claude acts as thinking partner — suggests directions, asks probing questions, challenges vagueness
- [ ] **DISC-06**: Structured starting points (Vision first, then Acceptance Criteria, No-Gos) but free-flowing conversation after
- [ ] **DISC-07**: Discussion works equally in Claude Code terminal AND dashboard UI

### Planning Artefakte

- [ ] **ART-01**: DECISIONS.md — all architecture/design decisions with rationale (global + phase-specific)
- [ ] **ART-02**: ACCEPTANCE-CRITERIA.md — testable conditions per feature/phase (global + phase-specific)
- [ ] **ART-03**: NO-GOS.md / CONSTRAINTS.md — explicit boundaries and prohibitions (global + phase-specific)
- [ ] **ART-04**: Existing artefakte (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md) enhanced with deeper content from discussion

### Planning Skills

- [ ] **PS-01**: Brainstorming Skill — Hard-gate design approval workflow, explore context, propose approaches with trade-offs
- [ ] **PS-02**: Roadmap-Writing Skill — Standardized roadmap format with phase structure, dependencies, success criteria
- [ ] **PS-03**: Context loading for planning — agents intelligently select relevant files based on discussion topic

### Dashboard

- [ ] **DASH-01**: `maxsimcli start` — single command starts Dashboard + MCP-Server + Terminal
- [ ] **DASH-02**: Unified mode (no Simple/Advanced split) — discussion UI primary + toggle-able terminal
- [ ] **DASH-03**: MCP-powered Q&A interface for discussion phases (UI for AskUserQuestion)
- [ ] **DASH-04**: Multi-project support — multiple dashboards/MCP-servers per project
- [ ] **DASH-05**: MCP server reliably working for dashboard communication
- [ ] **DASH-06**: Dashboard health check handles slow startups (up to 10s)
- [ ] **DASH-07**: File watcher debounced for bulk edits

### Performance

- [ ] **PERF-01**: Hot-path file I/O migrated to async
- [ ] **PERF-02**: Phase directory listing paginated for 100+ phases

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-runtime (OpenCode, Gemini, Codex) | Removed in v2.0, documented for future |
| Multi-user concurrent editing | Single-user by design |
| Cloud-hosted dashboard | Local-only |
| Time-based milestones | Quality over speed |
| Community skill marketplace | Not in v2.0, possible future feature |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SIMP-01 | Phase 1 | Pending |
| SIMP-03 | Phase 1 | Pending |
| SIMP-02 | Phase 2 | Pending |
| SIMP-04 | Phase 2 | Pending |
| SIMP-05 | Phase 2 | Pending |
| REL-01 | Phase 3 | Pending |
| REL-02 | Phase 3 | Pending |
| REL-03 | Phase 3 | Pending |
| SINF-01 | Phase 4 | Done |
| SINF-02 | Phase 4 | Done |
| SINF-03 | Phase 4 | Done |
| SINF-04 | Phase 4 | Done |
| CS-01 | Phase 5 | Done |
| CS-02 | Phase 5 | Done |
| CS-03 | Phase 5 | Done |
| CS-04 | Phase 5 | Done |
| ES-01 | Phase 6 | Done |
| ES-02 | Phase 6 | Done |
| ES-03 | Phase 6 | Done |
| ES-04 | Phase 6 | Done |
| EXEC-01 | Phase 6 | Done |
| EXEC-02 | Phase 6 | Done |
| EXEC-03 | Phase 6 | Done |
| DISC-01 | Phase 7 | Pending |
| DISC-02 | Phase 7 | Pending |
| DISC-03 | Phase 7 | Pending |
| DISC-04 | Phase 7 | Pending |
| DISC-05 | Phase 7 | Pending |
| DISC-06 | Phase 7 | Pending |
| DISC-07 | Phase 9 | Pending |
| ART-01 | Phase 7 | Pending |
| ART-02 | Phase 7 | Pending |
| ART-03 | Phase 7 | Pending |
| ART-04 | Phase 7 | Pending |
| PS-01 | Phase 8 | Pending |
| PS-02 | Phase 8 | Pending |
| PS-03 | Phase 8 | Pending |
| DASH-01 | Phase 9 | Pending |
| DASH-02 | Phase 9 | Pending |
| DASH-03 | Phase 9 | Pending |
| DASH-04 | Phase 9 | Pending |
| DASH-05 | Phase 9 | Pending |
| DASH-06 | Phase 9 | Pending |
| DASH-07 | Phase 9 | Pending |
| PERF-01 | Phase 10 | Pending |
| PERF-02 | Phase 10 | Pending |

**Coverage:**
- v2 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements refined: 2026-03-02 — Three pillars, 10 skills, 10 phases*
