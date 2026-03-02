---
name: writing-plans
description: Use when creating PLAN.md files for MAXSIM phases — standardizes plan format with TDD-style task definitions, dependency detection, and wave grouping
context: fork
---

# Writing Plans

A plan is a contract between the planner and the executor. Vague plans produce vague code.

**If the executor cannot execute your plan without asking questions, the plan is incomplete.**

## The Iron Law

<HARD-GATE>
EVERY TASK MUST HAVE VERIFY AND DONE BLOCKS.
If a task does not specify how to verify it and when it is done, it is not a task — it is a wish.
"The executor will figure it out" is abdication, not delegation.
Violating this rule is a violation — not flexibility.
</HARD-GATE>

## The Gate Function

### 1. DECOMPOSE — Break Phase Goal Into Tasks

- Each task is a single, atomic unit of work
- Tasks should take 15-60 minutes for a focused agent
- Tasks too large should be split; tasks too small should be merged
- Every task must produce a committable result

### 2. SPECIFY — Define Each Task Completely

Each task MUST include:

```markdown
### Task N: [Descriptive Title]

**Files:** [list of files to create/modify]

**Description:** [What to implement, with enough detail that another agent can do it without asking questions]

<verify>
[Exact commands to run to verify the task is complete]
npm run build
npm test
[specific test command if applicable]
</verify>

<done>
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]
</done>
```

### 3. DEPEND — Detect Dependencies Between Tasks

- If Task B reads a file that Task A creates → B depends on A
- If Task B calls a function that Task A implements → B depends on A
- If Task B modifies the same file as Task A → they CANNOT be parallel
- Dependencies must be explicit — implicit ordering is a bug

### 4. WAVE — Group Independent Tasks

Tasks are grouped into waves for execution:
- **Wave 1:** Tasks with no dependencies (can all run in parallel)
- **Wave 2:** Tasks that depend only on Wave 1 tasks
- **Wave N:** Tasks that depend on Wave N-1 tasks

```markdown
## Execution Order

**Wave 1** (parallel):
- Task 1: [title]
- Task 2: [title]

**Wave 2** (parallel, after Wave 1):
- Task 3: [title] — depends on Task 1
- Task 4: [title] — depends on Task 2

**Wave 3** (sequential):
- Task 5: [title] — depends on Task 3, Task 4
```

### 5. VALIDATE — Check Plan Completeness

Before submitting the plan:
- Does every task have `<verify>` and `<done>` blocks?
- Does the task set cover the phase's success criteria completely?
- Are dependencies correct and complete?
- Are waves correctly ordered?
- Could an executor run this plan without asking questions?

## Plan Structure Template

```markdown
# Phase [N] Plan [M]: [Phase Name]

## Overview
[1-2 sentences: what this plan achieves and why]

## Tasks

### Task 1: [Title]
...

### Task 2: [Title]
...

## Execution Order

**Wave 1** (parallel): Tasks 1, 2
**Wave 2** (parallel): Tasks 3, 4
**Wave 3** (sequential): Task 5

## Verification

After all tasks complete:
- [ ] [Phase-level success criterion 1]
- [ ] [Phase-level success criterion 2]
```

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "The executor is smart enough to figure it out" | Smart executors with vague plans produce inconsistent results. Be explicit. |
| "Verify blocks are obvious" | If they are obvious, writing them takes 10 seconds. Do it. |
| "Done criteria are implicit in the description" | Implicit criteria cannot be checked. Make them explicit checkboxes. |
| "Dependencies are clear from context" | Context dies between agents. Write dependencies explicitly. |
| "Wave grouping is premature optimization" | Wave grouping enables parallel execution. It is not optimization — it is correctness. |
| "The plan is too detailed" | Plans cannot be too detailed. They can only be too vague. |

## Red Flags — STOP If You Catch Yourself:

- Writing a task without a `<verify>` block
- Writing a `<done>` criterion that cannot be tested by running a command
- Assuming the executor knows which files to modify without listing them
- Creating a plan with no wave grouping (implies everything is sequential)
- Submitting a plan you could not execute yourself without asking questions

**If any red flag triggers: STOP. Add the missing specificity.**

## Verification Checklist

Before submitting a plan:

- [ ] Every task has a `<verify>` block with runnable commands
- [ ] Every task has a `<done>` block with testable criteria
- [ ] Every task lists the files it will create or modify
- [ ] Dependencies between tasks are explicitly stated
- [ ] Tasks are grouped into waves with correct ordering
- [ ] The task set covers all phase success criteria
- [ ] An executor could run this plan without asking questions

## Integration with MAXSIM

### Context Loading

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs skill-context writing-plans
```

### Plan Naming Convention

Plans are numbered per phase: `{phase_number}-{plan_number}-PLAN.md`
- Example: `04-01-PLAN.md` (Phase 4, Plan 1)
- Multiple plans per phase are allowed (for large phases)

### Artifact References

- Reference `.planning/ROADMAP.md` for phase success criteria
- Reference `.planning/phases/{current}/RESEARCH.md` for implementation findings
- Reference `.planning/phases/{current}/CONTEXT.md` for user decisions
- Reference `.planning/codebase/STRUCTURE.md` for file organization conventions

### STATE.md Hooks

- Record plan creation as a milestone in STATE.md
- Update current position to reflect the new plan
- Plans feed into MAXSIM's plan-check verification before execution begins
