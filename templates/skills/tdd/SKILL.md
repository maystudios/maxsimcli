---
name: tdd
description: Use when implementing any feature or bug fix — requires writing a failing test before any implementation code
context: fork
---

# Test-Driven Development (TDD)

Write the test first. Watch it fail. Write minimal code to pass. Clean up.

**If you did not watch the test fail, you do not know if it tests the right thing.**

## The Iron Law

<HARD-GATE>
NO IMPLEMENTATION CODE WITHOUT A FAILING TEST FIRST.
If you wrote production code before the test, DELETE IT. Start over.
No exceptions. No "I'll add tests after." No "keep as reference."
Violating this rule is a violation — not a judgment call.
</HARD-GATE>

## The Gate Function

Follow this cycle for every behavior change, feature addition, or bug fix.

### 1. RED — Write Failing Test

- Write ONE minimal test that describes the desired behavior
- Test name describes what SHOULD happen, not implementation details
- Use real code paths — mocks only when unavoidable (external APIs, databases)

### 2. VERIFY RED — Run the Test

```bash
# Run the test suite for this file
npx vitest run path/to/test.test.ts
```

- Test MUST fail (not error — fail with an assertion)
- Failure message must match the missing behavior
- If test passes immediately: you are testing existing behavior — rewrite it

### 3. GREEN — Write Minimal Code

- Write the SIMPLEST code that makes the test pass
- Do NOT add features the test does not require
- Do NOT refactor yet — that comes next

### 4. VERIFY GREEN — Run All Tests

```bash
npx vitest run
```

- The new test MUST pass
- ALL existing tests MUST still pass
- If any test fails: fix code, not tests

### 5. REFACTOR — Clean Up (Tests Still Green)

- Remove duplication, improve names, extract helpers
- Run tests after every change — they must stay green
- Do NOT add new behavior during refactor

### 6. REPEAT — Next failing test for next behavior

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "Too simple to test" | Simple code breaks. The test takes 30 seconds to write. |
| "I'll add tests after" | Tests written after pass immediately — they prove nothing. |
| "The test framework isn't set up yet" | Set it up. That is part of the task, not a reason to skip. |
| "I know the code works" | Knowledge is not evidence. A passing test is evidence. |
| "TDD is slower for this task" | TDD is faster than debugging. Every "quick skip" creates debt. |
| "Let me keep the code as reference" | You will adapt it instead of writing test-first. Delete means delete. |
| "I need to explore the design first" | Explore, then throw it away. Start implementation with TDD. |

## Red Flags — STOP If You Catch Yourself:

- Writing implementation code before writing a test
- Writing a test that passes on the first run (you are testing existing behavior)
- Skipping the VERIFY RED step ("I know it will fail")
- Adding features beyond what the current test requires
- Skipping the REFACTOR step to save time
- Rationalizing "just this once" or "this is different"
- Keeping pre-TDD code "as reference" while writing tests

**If any red flag triggers: STOP. Delete the implementation. Write the test first.**

## Verification Checklist

Before claiming TDD compliance, confirm:

- [ ] Every new function/method has a corresponding test
- [ ] Each test was written BEFORE its implementation
- [ ] Each test was observed to FAIL before implementation was written
- [ ] Each test failed for the expected reason (missing behavior, not syntax error)
- [ ] Minimal code was written to pass each test
- [ ] All tests pass after implementation
- [ ] Refactoring (if any) did not break any tests

Cannot check all boxes? You skipped TDD. Start over.

## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test it | Write the assertion first. What should the output be? |
| Test setup is too complex | The design is too complex. Simplify the interface. |
| Must mock everything | Code is too coupled. Use dependency injection. |
| Existing code has no tests | Add tests for the code you are changing. Start the cycle now. |

## Integration with MAXSIM

### Context Loading

When running within a MAXSIM project, load project context:

```bash
node ~/.claude/maxsim/bin/maxsim-tools.cjs skill-context tdd
```

This returns: current phase, active plan, artifact paths, and recent decisions. Use this to:
- Reference the current plan's `<verify>` blocks when writing tests
- Know which phase you are implementing within
- Check for existing test patterns in the project

### STATE.md Hooks

Track TDD metrics in STATE.md via the tools router:
- After each RED→GREEN→REFACTOR cycle, the executor records the cycle in the plan's task completion
- TDD violations (production code before test) are recorded as deviations
- Cycle count is tracked per task for velocity metrics

### Commit Protocol

In MAXSIM plan execution, tasks marked `tdd="true"` follow this cycle with per-step commits:
- **RED commit:** `test({phase}-{plan}): add failing test for [feature]`
- **GREEN commit:** `feat({phase}-{plan}): implement [feature]`
- **REFACTOR commit (if changes made):** `refactor({phase}-{plan}): clean up [feature]`

### Artifact References

- Check `.planning/phases/{current}/PLAN.md` for task-specific test requirements
- Reference `.planning/phases/{current}/RESEARCH.md` for test patterns discovered during research
- Test results feed into SUMMARY.md documentation
