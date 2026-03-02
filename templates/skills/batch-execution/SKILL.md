---
name: batch-execution
description: Use when a task can be decomposed into 5-30 independent units — spawns parallel agents in isolated git worktrees, each producing its own PR
context: fork
---

# Batch Execution

Parallel work multiplies throughput. Sequential execution of independent tasks wastes time.

**If the tasks are independent, they should run in parallel.**

## The Iron Law

<HARD-GATE>
INDEPENDENT TASKS MUST RUN IN PARALLEL.
If you have identified 5+ independent work units, you CANNOT execute them sequentially.
"One at a time is simpler" is waste, not caution.
Violating this rule is a violation — not a preference.
</HARD-GATE>

## The Gate Function

### 1. DECOMPOSE — Break Work Into Independent Units

- Analyze the task for independent, self-contained units
- Each unit must: modify different files, be mergeable alone, not depend on sibling units
- Target 5-30 units depending on scope (few files → 5, many files → 30)
- Units should be roughly uniform in size

### 2. VERIFY INDEPENDENCE — Check for Conflicts

- No two units modify the same file (or the same section of a shared file)
- No unit depends on another unit's output to start
- Each unit can be tested in isolation
- Merge order does not matter

### 3. SPAWN — Create Isolated Workers

- Each worker gets its own git worktree (isolated copy of the repo)
- Each worker receives: the overall goal, its specific unit task, codebase conventions, verification recipe
- All workers launch simultaneously in a single message
- Workers run in background — do not block on individual completion

### 4. MONITOR — Track Progress

Maintain a status table:

| # | Unit | Status | PR |
|---|------|--------|----|
| 1 | <title> | running / done / failed | <url> |

- Update as workers report completion
- Track failures separately with brief error notes

### 5. VERIFY — Check Each Worker's Output

- Each worker must: run tests, verify build, commit, push, create PR
- Failed workers are retried once with the error context
- If a worker fails twice, mark as failed and note the reason

### 6. AGGREGATE — Merge Results

- All PRs should pass CI independently
- Merge in any order (independence guarantee)
- Produce a final summary: X/Y units completed as PRs

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "Sequential is simpler" | Simpler for you, slower for the user. Parallel is the job. |
| "What if they conflict?" | Verify independence first (step 2). If they conflict, they are not independent — re-decompose. |
| "Too many agents" | The threshold is 5 units. Below 5, sequential is acceptable. Above 5, parallelize. |
| "I'll batch the small ones" | Small units are the easiest to parallelize. Do not combine them. |
| "Worktrees are complex" | Worktree creation is automated. Your job is decomposition and monitoring. |

## Red Flags — STOP If You Catch Yourself:

- Running independent tasks one at a time
- Creating units that modify the same file
- Launching workers without independence verification
- Not monitoring worker progress
- Merging without checking each PR passes CI

**If any red flag triggers: STOP. Re-decompose or verify independence before proceeding.**

## Verification Checklist

Before claiming batch execution is complete:

- [ ] All work units were independent (no shared file modifications)
- [ ] All workers ran in isolated git worktrees
- [ ] All workers were launched simultaneously (not sequentially)
- [ ] Progress was tracked via status table
- [ ] Each completed worker produced a PR
- [ ] Failed workers were retried once or documented
- [ ] Final summary shows completion rate

## Integration with MAXSIM

### Context Loading

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs skill-context batch-execution
```

### In Plan Execution

Batch execution applies when a plan has multiple independent tasks in the same wave:
- The orchestrator identifies independent tasks within a wave
- Each task is assigned to a worker in an isolated worktree
- Workers follow the full task protocol (implement → simplify → verify → commit)
- The orchestrator aggregates results and updates the phase status

### STATE.md Hooks

- Record batch execution start with unit count
- Track completion rate as workers finish
- Record final aggregate result (X/Y succeeded)
- Failed units become blockers for follow-up
