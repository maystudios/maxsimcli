# Phase 1: Context Rot Prevention — Context

**Created:** 2026-03-06
**Phase goal:** MAXSIM actively prevents context accumulation in its own planning documents — completed phases are archived, stale state is pruned, and active docs contain only current-milestone context.

---

## 1. Archival Triggers & Automation

**Decision: Auto-archive on phase complete, with confirmation.**

- When `/maxsim:complete-phase` runs, archival triggers automatically as part of the completion flow.
- **Full sweep**: archive moves the phase directory AND prunes ROADMAP.md AND prunes STATE.md in one atomic operation. One tool call, one commit.
- **Confirmation required**: show a summary of what will be archived/pruned and ask for user confirmation before proceeding. Not silent.
- No separate `/maxsim:archive` command needed — archival is built into the phase completion workflow.

## 2. "Stale" Definition & Pruning Rules

**Decision: Aggressive pruning at both phase and milestone boundaries.**

### On phase complete (mid-milestone):
- Phase directory moves to archive.
- Phase-specific decisions and resolved blockers in STATE.md are removed.
- ROADMAP.md entry for the completed phase collapses to a status line (see section 4).

### On milestone complete:
- Full STATE.md reset: decisions, blockers, and metrics all archived. STATE.md starts fresh with only the new milestone's "Current Position" section.
- Milestone-level snapshots of STATE.md and ROADMAP.md are saved to the archive before reset.

### What does NOT carry forward:
- No decisions carry forward across milestones automatically. If a decision is still relevant, it must be re-established in the new milestone context. This forces intentional context rather than accumulated baggage.

## 3. Archive Structure & Retrievability

**Decision: Milestone-grouped, git-tracked, agent-accessible.**

### Directory structure:
```
.planning/archive/
  v4/
    STATE.md              # Frozen STATE.md snapshot at milestone close
    ROADMAP.md            # Frozen ROADMAP.md snapshot at milestone close
    01-Foundation/        # Phase directories as-is
    02-Init/
    ...
  v5/
    STATE.md
    ROADMAP.md
    01-Context-Rot-Prevention/
    ...
```

### Retrievability:
- A CLI tool command (e.g., `get-archived-phase`) allows agents to fetch specific archived phase data on demand.
- Archive is NOT auto-loaded into agent context. Agents must explicitly request it when they need historical reference.
- Archive is git-tracked — committed alongside `.planning/`. Full history available to team members.

## 4. ROADMAP.md Completed Phase Representation

**Decision: Checkbox with outcome summary, criteria stripped.**

### Format for completed phases:
```markdown
- [x] Phase 1: Context Rot Prevention — auto-archive, STATE pruning, milestone snapshots
```

- Full Goal and Success criteria sections are stripped from completed phases.
- Only the status line with a brief outcome summary remains.
- Pending/active phases retain their full detail (Goal, Success criteria, etc.).

### Example ROADMAP.md after 2 phases complete:
```markdown
## Milestone: v5.0 Context-Aware SDD

- [x] Phase 1: Context Rot Prevention — auto-archive, STATE pruning, milestone snapshots
- [x] Phase 2: Deep Init Questioning — 12 questions, tech stack research agent

### Phase 3: Agent Coherence
**Goal:** Agents operate as a coordinated system...
**Success criteria:**
- ...
```

### Timing:
- ROADMAP.md pruning happens in the same atomic operation as directory archival and STATE.md pruning. All three are one unit of work.

---

## Implementation Constraints

- All archival logic lives in `packages/cli/src/core/` (likely `milestone.ts` and `phase.ts`).
- Must not break existing `/maxsim:complete-phase` or `/maxsim:complete-milestone` interfaces (GUARD-02).
- Must not break existing `.planning/` file format for projects that haven't archived yet (GUARD-03).
- The `get-archived-phase` tool command must be added to `cli.ts` dispatch.

## Deferred Ideas

None surfaced during discussion.
