---
name: maxsim:batch
description: Decompose a large task into independent units and execute each in an isolated git worktree with its own PR
argument-hint: "<task description>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Decompose a large task into independent units, execute each in an isolated git worktree, and produce one PR per unit.

Batch mode uses the full MAXSIM system with worktree isolation:
- Spawns maxsim-planner (batch mode) to decompose the task into independent units
- Validates file independence across all units (no overlap allowed)
- Spawns one worktree agent per unit, each with its own branch and PR
- Tracks progress and handles failures with automatic retries
- Records batch metadata in `.planning/batch/`

**Use when:** Task has 3+ independent units that can be implemented in parallel.
**Do not use when:** Fewer than 3 units (use `/maxsim:quick` instead) or units have sequential dependencies.
</objective>

<execution_context>
@./workflows/batch.md
</execution_context>

<context>
$ARGUMENTS

Context files are resolved inside the workflow (`init quick`) and delegated via `<files_to_read>` blocks.
</context>

<process>
Execute the batch workflow from @./workflows/batch.md end-to-end.
Preserve all workflow gates (validation, decomposition, independence check, agent spawning, tracking, state updates).
</process>
