---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior — requires root cause investigation before attempting any fix
context: fork
---

# Systematic Debugging

Random fixes waste time and create new bugs. Find the root cause first.

**If you have not identified the root cause, you are guessing — not debugging.**

## The Iron Law

<HARD-GATE>
NO FIX ATTEMPTS WITHOUT UNDERSTANDING ROOT CAUSE.
If you have not completed the REPRODUCE and HYPOTHESIZE steps, you CANNOT propose a fix.
"Let me just try this" is guessing, not debugging.
Violating this rule is a violation — not a time-saving shortcut.
</HARD-GATE>

## The Gate Function

Follow these steps IN ORDER for every bug, test failure, or unexpected behavior.

### 1. REPRODUCE — Confirm the Problem

- Run the failing command or test. Capture the EXACT error output.
- Can you trigger it reliably? What are the exact steps?
- If not reproducible: gather more data — do not guess.

```bash
# Example: reproduce a test failure
npx vitest run path/to/failing.test.ts
```

### 2. HYPOTHESIZE — Form a Theory

- Read the error message COMPLETELY (stack trace, line numbers, exit codes)
- Check recent changes: `git diff`, recent commits, new dependencies
- Trace data flow: where does the bad value originate?
- State your hypothesis clearly: "I think X is the root cause because Y"

### 3. ISOLATE — Narrow the Scope

- Find the SMALLEST reproduction case
- In multi-component systems, add diagnostic logging at each boundary
- Identify which SPECIFIC layer or component is failing
- Compare against working examples in the codebase

### 4. VERIFY — Test Your Hypothesis

- Make the SMALLEST possible change to test your hypothesis
- Change ONE variable at a time — never multiple things simultaneously
- If hypothesis is wrong: form a NEW hypothesis, do not stack fixes

### 5. FIX — Address the Root Cause

- Write a failing test that reproduces the bug (see TDD skill)
- Implement a SINGLE fix that addresses the root cause
- No "while I'm here" improvements — fix only the identified issue

### 6. CONFIRM — Verify the Fix

- Run the original failing test: it must now pass
- Run the full test suite: no regressions
- Verify the original error no longer occurs

```bash
# Confirm the specific fix
npx vitest run path/to/fixed.test.ts
# Confirm no regressions
npx vitest run
```

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "I think I know what it is" | Thinking is not evidence. Reproduce first, then hypothesize. |
| "Let me just try this fix" | "Just try" = guessing. You have skipped REPRODUCE and HYPOTHESIZE. |
| "Quick patch for now, investigate later" | "Later" never comes. Patches mask the real problem. |
| "Multiple changes at once saves time" | You cannot isolate what worked. You will create new bugs. |
| "The issue is simple, I don't need the process" | Simple bugs have root causes too. The process is fast for simple bugs. |
| "I'm under time pressure" | Systematic debugging IS faster than guess-and-check thrashing. |
| "The reference is too long, I'll skim it" | Partial understanding guarantees partial fixes. Read it completely. |

## Red Flags — STOP If You Catch Yourself:

- Changing code before reproducing the error
- Proposing a fix before reading the full error message and stack trace
- Trying random fixes hoping one will work
- Changing multiple things simultaneously
- Saying "it's probably X" without evidence
- Applying a fix that did not work, then adding another fix on top
- On your 3rd failed fix attempt (this signals an architectural problem — escalate)

**If any red flag triggers: STOP. Return to step 1 (REPRODUCE).**

**If 3+ fix attempts have failed:** The issue is likely architectural, not a simple bug. Document what you have tried and escalate to the user for a design decision.

## Verification Checklist

Before claiming a bug is fixed, confirm:

- [ ] The original error has been reproduced reliably
- [ ] Root cause has been identified with evidence (not guessed)
- [ ] A failing test reproduces the bug
- [ ] A single, targeted fix addresses the root cause
- [ ] The failing test now passes
- [ ] The full test suite passes (no regressions)
- [ ] The original error no longer occurs when running the original steps

## Integration with MAXSIM

### Context Loading

When debugging within a MAXSIM project, load project context first:

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs skill-context systematic-debugging
```

This returns current phase, artifacts, and recent decisions. Use this to:
- Cross-reference memory files (`.claude/memory/errors.md`) for known bugs
- Check if the issue was already investigated in a previous phase's RESEARCH.md
- Understand the architectural context around the failing component

### Memory Cross-Referencing

Before starting the REPRODUCE step, check project memory:
1. Read `.claude/memory/errors.md` if it exists — the bug may already be documented with a known fix
2. Read `.planning/phases/{current}/RESEARCH.md` if it exists — prior research may explain the failure
3. If you find a match, verify the documented fix still applies before using it

### STATE.md Hooks

Track debugging sessions in STATE.md:
- When entering a debug session, record the bug description as a blocker
- When Rule 4 triggers (3+ failed fix attempts), escalate the blocker with architectural flag
- When the bug is resolved, remove the blocker and add a decision entry with the root cause

### Deviation Rules in Plan Execution

When debugging during MAXSIM plan execution:
- **Rule 1 (Auto-fix bugs):** You may auto-fix bugs found during execution, but you must still follow this debugging process completely.
- **Rule 4 (Architectural changes):** If 3+ fix attempts fail, STOP and return a checkpoint — this is an architectural decision for the user.
- Track all debugging deviations for SUMMARY.md documentation.
- Record the root cause analysis in the task's completion notes.

### Artifact References

- Check `.planning/phases/{current}/RESEARCH.md` for prior investigation context
- Bug fixes feed into SUMMARY.md as deviation documentation
- Root cause findings may warrant updates to `.planning/codebase/CONCERNS.md`
