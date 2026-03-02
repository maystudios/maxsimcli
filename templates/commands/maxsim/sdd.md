---
name: maxsim:sdd
description: Execute a phase using Spec-Driven Dispatch — fresh agent per task with 2-stage review
argument-hint: "<phase-number>"
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
Execute phase plans using the Spec-Driven Dispatch (SDD) pattern. Each task is dispatched to a fresh-context subagent with minimal context. Two-stage review (spec compliance + code quality) runs between every task. No task starts until the previous task passes both review stages.

SDD differs from standard execute-phase:
- **Standard:** Single agent or segmented execution per plan
- **SDD:** Fresh agent per task with mandatory inter-task review gates

Context budget: ~10% orchestrator. 100% fresh per task agent. Zero context bleeding between tasks.
</objective>

<execution_context>
@./workflows/sdd.md
@./references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS

Context files are resolved inside the workflow via `maxsim-tools init execute-phase` and per-task `<files_to_read>` blocks.
</context>

<process>
Execute the SDD workflow from @./workflows/sdd.md end-to-end.
Preserve all workflow gates (task dispatch, 2-stage review, fix iteration cap, state updates, routing).
</process>
