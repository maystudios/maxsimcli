---
name: maxsim-batch
description: >-
  Decomposes large tasks into independent units and executes each in an isolated
  git worktree with its own branch and PR. Use when parallelizing work across
  3-30 independent units or orchestrating worktree-based parallel execution. Not
  for sequential dependencies or fewer than 3 units.
---

# Batch Worktree

Decompose large tasks into independent units, execute each in an isolated worktree, and produce one PR per unit.

**HARD GATE: Every unit must be independently mergeable. If merging unit A would break the build without unit B, they are not independent. Combine them or serialize them. No exceptions.**

## Process

### 1. Research -- Analyze and Decompose

List all units with a one-line description each. For each unit, list the files it will create or modify. Verify no file appears in more than one unit. If overlap exists, merge the overlapping units into one or extract shared code into a prerequisite unit that runs first.

For each pair of units, confirm:
- No shared file modifications
- No runtime dependency (unit A output is not unit B input)
- Each unit's tests pass without the other unit's changes

If validation fails, redesign the decomposition before proceeding.

### 2. Plan -- Define Unit Specifications

For each unit, prepare a specification containing:
- Unit description and acceptance criteria
- The list of files it owns (and only those files)
- The base branch to branch from
- Instructions to implement, test, commit, push, and create a PR

Record the decomposition decision:

```
node .claude/maxsim/bin/maxsim-tools.cjs state-add-decision "Batch decomposition: N units identified, no file overlap confirmed"
```

### 3. Spawn -- Create Worktree Per Unit

For each unit, create an isolated worktree and spawn an agent with `isolation: "worktree"`. Each agent receives its unit specification and works independently through: read relevant source, implement changes, run tests, commit, push, create PR.

### 4. Track -- Monitor Progress

Maintain a status table and update it as agents report back:

| # | Unit | Status | PR |
|---|------|--------|----|
| 1 | description | done | #123 |
| 2 | description | in-progress | -- |
| 3 | description | failed | -- |

Statuses: `pending`, `in-progress`, `done`, `failed`, `needs-review`

Failure handling:
- Unit fails tests: spawn a fix agent in the same worktree
- Merge conflict: decomposition was wrong, fix overlap and re-run unit
- Agent times out: re-spawn with the same unit description
- 3+ failures on same unit: stop and escalate to user

When all units complete, list all created PRs and flag any failed units with error summaries. If any unit failed, spawn a fix agent for that unit only.

## Common Pitfalls

- "The overlap is minor" -- Minor overlap causes merge conflicts. Split shared code into a prerequisite unit.
- "We'll merge in the right order" -- Order-dependent merges are not independent. Serialize those units.
- "Only 2 units, let's still use worktrees" -- Worktree overhead is not worth it for fewer than 3 units. Use sequential execution.

## Verification

Before reporting completion, confirm:

- [ ] All units were verified to touch non-overlapping files
- [ ] Each unit was implemented in an isolated worktree
- [ ] Each unit's tests pass independently
- [ ] Each unit has its own PR
- [ ] No PR depends on another PR being merged first
- [ ] Status table is complete with all PR links

## MAXSIM Integration

When a plan specifies `skill: "maxsim-batch"`:
- The orchestrator decomposes the plan's tasks into independent units
- Each unit becomes a worktree agent with its own branch and PR
- The orchestrator tracks progress and reports the final PR list in SUMMARY.md
- Failed units are retried once before escalating
