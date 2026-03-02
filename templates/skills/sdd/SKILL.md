---
name: sdd
description: Dispatch fresh subagent per task with 2-stage review between tasks
---

# Spec-Driven Dispatch (SDD)

Execute tasks sequentially, each in a fresh subagent with clean context. Review every task before moving to the next.

**If the previous task did not pass review, you do not start the next task.**

## When to Use

- Tasks are sequential and each builds on the previous
- Context rot is a concern (long plans, many files, complex logic)
- Each task benefits from starting with a clean context window
- You want enforced quality gates between tasks

Do NOT use this skill when:
- Tasks are independent and can run in parallel (use batch-worktree instead)
- The plan has only 1-2 small tasks (overhead is not worth it)
- All tasks modify the same small set of files (single-agent execution is simpler)

## The Iron Law

<HARD-GATE>
NO TASK STARTS UNTIL THE PREVIOUS TASK PASSES 2-STAGE REVIEW.
If the review found issues, they must be fixed before the next task begins.
No "we'll fix it later." No "it's close enough." No skipping review for simple tasks.
Violating this rule ships unreviewed code — the exact problem SDD prevents.
</HARD-GATE>

## Process

### 1. LOAD — Read the Plan

- Read the plan file (PLAN.md) to get the ordered task list
- For each task, identify: description, acceptance criteria, relevant files
- Confirm task order makes sense (later tasks may depend on earlier ones)

```bash
# Load plan context
INIT=$(node .claude/maxsim/bin/maxsim-tools.cjs init execute-phase "${PHASE}")
```

### 2. DISPATCH — Spawn Fresh Agent Per Task

For each task in order:

1. Assemble the task context:
   - Task description and acceptance criteria from the plan
   - Only the files relevant to this specific task
   - Results from previous tasks (commit hashes, created files) — NOT the full previous context
2. Spawn a fresh `general-purpose` agent with this minimal context
3. The agent implements the task, runs tests, and commits

```bash
# Record task dispatch
node .claude/maxsim/bin/maxsim-tools.cjs state-add-decision "SDD: dispatching task N — [description]"
```

### 3. REVIEW — 2-Stage Quality Gate

After each task completes, run two review stages before proceeding:

#### Stage 1: Spec Compliance

- Does the implementation match the task description?
- Are all acceptance criteria met?
- Were only the specified files modified (no scope creep)?
- Do the changes align with the plan's intent?

**Verdict:** PASS or FAIL with specific issues.

#### Stage 2: Code Quality

- Are there obvious bugs, edge cases, or error handling gaps?
- Is the code readable and consistent with codebase conventions?
- Are there unnecessary complications or dead code?
- Do all tests pass?

```bash
# Run tests to verify
npx vitest run
```

**Verdict:** PASS or FAIL with specific issues.

### 4. FIX — Address Review Failures

If either review stage fails:

1. Spawn a NEW fresh agent with:
   - The original task description
   - The review feedback (specific issues found)
   - The current state of the files
2. The fix agent addresses ONLY the review issues — no new features
3. Re-run both review stages on the fixed code
4. If 3 fix attempts fail: STOP and escalate to the user

### 5. ADVANCE — Move to Next Task

Only after both review stages pass:
- Record the task as complete
- Note the commit hash and any files created/modified
- Pass this minimal summary (not full context) to the next task's agent

```bash
# Record task completion
node .claude/maxsim/bin/maxsim-tools.cjs state-add-decision "SDD: task N complete — [summary]"
```

### 6. REPORT — Final Summary

After all tasks complete:
- List each task with its status and commit hash
- Note any tasks that required fix iterations
- Summarize the total changes made

## Context Management Rules

Each agent receives ONLY what it needs:

| Context Item | Included? |
|-------------|-----------|
| Task description + acceptance criteria | Always |
| Files relevant to this task | Always |
| Previous task commit hashes | Always |
| Previous task full diff | Never |
| Previous task agent conversation | Never |
| PROJECT.md / REQUIREMENTS.md | Only if task references project-level concerns |
| Full codebase | Never — only specified files |

**The point of SDD is fresh context. Loading the previous agent's full context defeats the purpose.**

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "This task is simple, skip review" | Simple tasks still have bugs. Review takes seconds for simple code. |
| "Review is slowing us down" | Unreviewed code slows you down more when bugs compound across tasks. |
| "Just pass the full context forward" | Full context = context rot. Minimal summaries keep agents effective. |
| "Fix it in the next task" | The next task's agent does not know about the bug. Fix it now. |
| "The agent knows best, trust it" | Agents make mistakes. That is why review exists. |

## Red Flags — STOP If You Catch Yourself:

- Starting a new task before the previous one passed review
- Passing full conversation history to the next agent
- Skipping Stage 1 or Stage 2 of the review
- Accumulating "fix later" items across tasks
- On the 3rd fix attempt for the same review issue (escalate to user)

**If any red flag triggers: STOP. Complete the review cycle for the current task before proceeding.**

## Verification Checklist

Before reporting completion, confirm:

- [ ] Every task was executed by a fresh agent with minimal context
- [ ] Every task passed both spec compliance and code quality review
- [ ] No task was skipped or started before the previous task passed review
- [ ] Fix iterations (if any) are documented
- [ ] All tests pass after the final task
- [ ] Summary includes per-task status and commit hashes

## In MAXSIM Plan Execution

When a plan specifies `skill: "sdd"`:
- The orchestrator reads tasks from PLAN.md in order
- Each task is dispatched to a fresh subagent
- 2-stage review runs between every task
- Failed reviews trigger fix agents (up to 3 attempts)
- Progress is tracked in STATE.md via decision entries
- Final results are recorded in SUMMARY.md
