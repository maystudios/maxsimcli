---
name: subagent-driven-development
description: Use when executing multi-task plans — spawns a fresh subagent per task with 2-stage review between tasks to prevent context rot
context: fork
---

# Subagent-Driven Development (SDD)

Context rots. Fresh agents make fewer mistakes than tired ones.

**If your context is deep, your next task deserves a fresh agent.**

## The Iron Law

<HARD-GATE>
ONE TASK PER SUBAGENT.
Each task in a plan gets a fresh subagent with clean context.
"I'll just keep going" produces context-rotted code.
Violating this rule is a violation — not efficiency.
</HARD-GATE>

## The Gate Function

### 1. PREPARE — Assemble Task Context

For each task in the plan:
- Extract ONLY the files and sections relevant to this specific task
- Include: task description, verify block, done criteria, relevant code files
- Exclude: other tasks' context, completed task details, unrelated code
- Context should be minimal and focused — less is more

### 2. SPAWN — Fresh Agent Per Task

- Create a new subagent with ONLY the task-specific context
- The subagent receives: task spec, relevant files, codebase conventions, verification recipe
- The subagent does NOT receive: other tasks, full plan, accumulated session context
- Each subagent starts with maximum available context window

### 3. EXECUTE — Task Implementation

The subagent follows the standard task protocol:
1. Read and understand the task requirements
2. Implement using TDD (if applicable)
3. Run verification commands
4. Produce evidence block
5. Commit with task-specific message

### 4. REVIEW — 2-Stage Review Between Tasks

After each task completes, before starting the next:

**Stage 1 (Spec Review):** Does the implementation match the task's `<done>` criteria exactly?
**Stage 2 (Code Review):** Does the code meet quality standards?

If either stage fails: the task is not complete. Fix issues before proceeding.

### 5. HANDOFF — Transfer Context to Next Task

- Record what was done (files changed, decisions made)
- DO NOT carry forward the full implementation context
- The next subagent starts fresh — it reads the committed code, not the session history
- Checkpoint the progress in STATE.md

### 6. REPEAT — Next task, fresh agent

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "I have context from the last task" | That context is rotting. Fresh agent, fresh perspective. |
| "Spawning agents is overhead" | Context rot costs more than spawn time. The math is clear. |
| "I can do multiple tasks efficiently" | Efficiency without accuracy is waste. One task, one agent. |
| "The tasks are related" | Related tasks still get separate agents. Share via committed code, not session state. |
| "Review between tasks slows things down" | Review catches what rot misses. The slowdown is an investment. |

## Red Flags — STOP If You Catch Yourself:

- Executing multiple tasks in the same agent context
- Carrying forward accumulated context to the next task
- Skipping the 2-stage review between tasks
- Loading the entire plan into a single agent
- Not checkpointing progress between tasks

**If any red flag triggers: STOP. Checkpoint, spawn fresh agent, continue.**

## Verification Checklist

Before claiming SDD execution is complete:

- [ ] Each task was executed by a separate, fresh subagent
- [ ] Each subagent received only task-relevant context
- [ ] 2-stage review ran between every pair of tasks
- [ ] All review issues were resolved before proceeding
- [ ] Progress was checkpointed in STATE.md between tasks
- [ ] No accumulated context was carried forward

## Integration with MAXSIM

### Context Loading

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs skill-context subagent-driven-development
```

### Task-Based Context Loading (EXEC-03)

The key innovation of SDD is task-based context loading:
- Each subagent receives only the files/sections relevant to its assignment
- The orchestrator determines relevant files from the task's file list in the plan
- Additional context is loaded on-demand if the subagent needs it
- This prevents context bloat and maximizes each agent's effective context window

### STATE.md Hooks

- Record task start/complete with subagent assignment
- Checkpoint after each task for resume capability
- Track inter-task review results
- Record any deviations from the plan

### In Plan Execution

SDD is the default execution model for MAXSIM plans:
- The orchestrator reads the plan's task list
- For each task (or wave of parallel tasks), fresh subagents are spawned
- Between tasks/waves, 2-stage review runs
- The orchestrator never executes tasks itself — it only coordinates
