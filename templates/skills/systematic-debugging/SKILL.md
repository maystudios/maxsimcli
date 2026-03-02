---
name: systematic-debugging
description: >-
  Investigates bugs through systematic root-cause analysis: reproduce, hypothesize,
  isolate, verify, fix, confirm. Use when encountering any bug, test failure,
  unexpected behavior, or error message.
---

# Systematic Debugging

Find the root cause first. Random fixes waste time and create new bugs.

**HARD GATE -- No fix attempts without understanding root cause. If you have not completed the REPRODUCE and HYPOTHESIZE steps, you cannot propose a fix.**

## Process

### 1. REPRODUCE -- Confirm the Problem

- Run the failing command or test. Capture the EXACT error output.
- Can you trigger it reliably? What are the exact steps?
- If not reproducible: gather more data -- do not guess.

### 2. HYPOTHESIZE -- Form a Theory

- Read the error message completely (stack trace, line numbers, exit codes).
- Check recent changes: `git diff`, recent commits, new dependencies.
- Trace data flow: where does the bad value originate?
- State your hypothesis clearly: "I think X is the root cause because Y."

### 3. ISOLATE -- Narrow the Scope

- Find the smallest reproduction case.
- In multi-component systems, add diagnostic logging at each boundary.
- Identify which specific layer or component is failing.
- Compare against working examples in the codebase.

### 4. VERIFY -- Test Your Hypothesis

- Make the smallest possible change to test your hypothesis.
- Change one variable at a time -- never multiple things simultaneously.
- If hypothesis is wrong: form a new hypothesis, do not stack fixes.

### 5. FIX -- Address the Root Cause

- Write a failing test that reproduces the bug.
- Implement a single fix that addresses the root cause.
- No "while I'm here" improvements -- fix only the identified issue.

### 6. CONFIRM -- Verify the Fix

- Run the original failing test: it must now pass.
- Run the full test suite: no regressions.
- Verify the original error no longer occurs.

## Common Pitfalls

| Excuse | Reality |
|--------|---------|
| "I think I know what it is" | Thinking is not evidence. Reproduce first. |
| "Let me just try this fix" | That is guessing. Complete REPRODUCE and HYPOTHESIZE first. |
| "Multiple changes at once saves time" | You cannot isolate what worked. You will create new bugs. |
| "The issue is simple" | Simple bugs have root causes too. The process is fast for simple bugs. |

Stop immediately if you catch yourself changing code before reproducing, proposing a fix before reading the full error, trying random fixes, or changing multiple things at once. If any of these triggers, return to step 1.

If 3+ fix attempts have failed, the issue is likely architectural. Document what you have tried and escalate to the user.

## Verification

Before claiming a bug is fixed, confirm:

- [ ] The original error has been reproduced reliably
- [ ] Root cause has been identified with evidence (not guessed)
- [ ] A failing test reproduces the bug
- [ ] A single, targeted fix addresses the root cause
- [ ] The failing test now passes
- [ ] The full test suite passes (no regressions)
- [ ] The original error no longer occurs when running the original steps

## MAXSIM Integration

When debugging during plan execution, MAXSIM deviation rules apply:
- **Rule 1 (Auto-fix bugs):** You may auto-fix bugs found during execution, but you must still follow this debugging process.
- **Rule 4 (Architectural changes):** If 3+ fix attempts fail, STOP and return a checkpoint -- this is an architectural decision for the user.
- Track all debugging deviations for SUMMARY.md documentation.
