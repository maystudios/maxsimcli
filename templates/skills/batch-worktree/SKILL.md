---
name: batch-worktree
description: Orchestrate parallel work across isolated git worktrees with independent PRs
---

# Batch Worktree

Decompose large tasks into independent units, execute each in an isolated worktree, and produce one PR per unit.

**If units share overlapping files, you cannot parallelize them. Serialize or redesign.**

## When to Use

- The task is decomposable into 5-30 independent units
- Each unit can be implemented, tested, and merged independently
- Units touch non-overlapping files (no merge conflicts between units)
- You want parallel execution with isolated git state per unit

Do NOT use this skill when:
- Units have sequential dependencies (use SDD instead)
- The task has fewer than 3 units (overhead is not worth it)
- Units modify the same files (merge conflicts will block you)

## The Iron Law

<HARD-GATE>
EVERY UNIT MUST BE INDEPENDENTLY MERGEABLE.
If merging unit A would break the build without unit B, they are not independent — combine them or serialize them.
No exceptions. No "we'll merge them in order." No "it'll probably be fine."
Violating this rule produces unmergeable PRs — wasted work.
</HARD-GATE>

## Process

### 1. DECOMPOSE — Split Task into Independent Units

- List all units with a clear one-line description each
- For each unit, list the files it will create or modify
- Verify NO file appears in more than one unit
- If overlap exists: merge the overlapping units into one, or extract shared code into a prerequisite unit that runs first

```bash
# Document the decomposition
node .claude/maxsim/bin/maxsim-tools.cjs state-add-decision "Batch decomposition: N units identified, no file overlap confirmed"
```

### 2. VALIDATE — Confirm Independence

For each pair of units, verify:
- No shared file modifications
- No runtime dependency (unit A's output is not unit B's input)
- Each unit's tests pass without the other unit's changes

If validation fails: redesign the decomposition. Do not proceed with overlapping units.

### 3. SPAWN — Create Worktree Per Unit

For each unit, create an isolated worktree and spawn an agent:

```bash
# Create worktree branch for each unit
git worktree add .claude/worktrees/unit-NN unit/NN-description -b unit/NN-description
```

Spawn one agent per unit with `isolation: "worktree"`. Each agent receives:
- The unit description and acceptance criteria
- The list of files it owns (and ONLY those files)
- The base branch to branch from
- Instructions to: implement, test, commit, push, create PR

### 4. EXECUTE — Each Agent Works Independently

Each spawned agent follows this sequence:
1. Read the unit description and relevant source files
2. Implement the changes (apply TDD or simplify skills as configured)
3. Run tests — all must pass
4. Commit with a descriptive message referencing the unit
5. Push the branch
6. Create a PR with unit description as the body

### 5. TRACK — Monitor Progress

Maintain a status table and update it as agents report back:

```markdown
| # | Unit | Status | PR |
|---|------|--------|----|
| 1 | description | done | #123 |
| 2 | description | in-progress | — |
| 3 | description | failed | — |
```

Statuses: `pending`, `in-progress`, `done`, `failed`, `needs-review`

### 6. REPORT — Collect Results

When all units complete:
- List all created PRs
- Flag any failed units with error summaries
- If any unit failed: spawn a fix agent for that unit only

## Handling Failures

| Situation | Action |
|-----------|--------|
| Unit fails tests | Spawn a fix agent in the same worktree |
| Unit has merge conflict | The decomposition was wrong — fix overlap, re-run unit |
| Agent times out | Re-spawn with the same unit description |
| 3+ failures on same unit | Stop and escalate to user — likely an architectural issue |

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "The overlap is minor" | Minor overlap = merge conflicts. Split the shared code into a prerequisite unit. |
| "We'll merge in the right order" | Order-dependent merges are not independent. Serialize those units. |
| "It's faster to do them all in one branch" | One branch means one context window. Worktrees give each unit fresh context. |
| "Only 2 units, let's still use worktrees" | Worktree overhead is not worth it for <3 units. Use sequential execution. |

## Verification Checklist

Before reporting completion, confirm:

- [ ] All units were verified to touch non-overlapping files
- [ ] Each unit was implemented in an isolated worktree
- [ ] Each unit's tests pass independently
- [ ] Each unit has its own PR
- [ ] No PR depends on another PR being merged first
- [ ] Status table is complete with all PR links

## In MAXSIM Plan Execution

When a plan specifies `skill: "batch-worktree"`:
- The orchestrator decomposes the plan's tasks into independent units
- Each unit becomes a worktree agent with its own branch and PR
- The orchestrator tracks progress and reports the final PR list in SUMMARY.md
- Failed units are retried once before escalating
