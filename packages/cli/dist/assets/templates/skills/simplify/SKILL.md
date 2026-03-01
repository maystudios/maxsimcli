---
name: simplify
description: Use after implementation and before commit — requires reviewing changed code for reuse opportunities, quality issues, and unnecessary complexity
---

# Simplify

Every line of code is a liability. Less code that does the same thing is always better.

**If you have not looked for ways to simplify, you are shipping the first draft.**

## The Iron Law

<HARD-GATE>
NO COMMIT WITHOUT REVIEWING FOR SIMPLIFICATION.
If you have not checked for duplication, dead code, and unnecessary complexity, you CANNOT commit.
"It works" is the starting point, not the finish line.
Violating this rule is a violation — not a preference.
</HARD-GATE>

## The Gate Function

After implementation is complete and tests pass, BEFORE committing:

### 1. DIFF — Review What Changed

- Run `git diff --staged` (or `git diff` for unstaged changes)
- Read every line you are about to commit
- Flag anything that feels "off" — trust that instinct

```bash
# Review staged changes
git diff --staged
# Or all uncommitted changes
git diff
```

### 2. DUPLICATION — Find Reuse Opportunities

- Does any new code duplicate existing logic in the codebase?
- Are there two or more blocks that do similar things and could share a helper?
- Could an existing utility, library function, or helper replace new code?
- Is there copy-paste from another file that should be extracted?

**Rule of three:** If the same pattern appears three times, extract it. Two occurrences are acceptable.

### 3. DEAD CODE — Remove What Is Not Used

- Are there unused imports, variables, or functions?
- Are there commented-out code blocks? (Delete them — git has history)
- Are there unreachable branches or impossible conditions?
- Are there parameters that are always passed the same value?

**If it is not called, it does not belong. Delete it.**

### 4. COMPLEXITY — Question Every Abstraction

- Is there a wrapper that adds no value beyond indirection?
- Is there a generic solution where a specific one would be simpler?
- Are there feature flags, configuration options, or extension points for hypothetical future needs?
- Could a 3-line inline block replace a 20-line abstraction?

**The right amount of abstraction is the minimum needed for the current requirements.**

### 5. CLARITY — Improve Readability

- Are variable and function names self-explanatory?
- Could a confusing block be rewritten more clearly without comments?
- Are there nested conditions that could be flattened with early returns?
- Is the control flow straightforward or unnecessarily clever?

### 6. EFFICIENCY — Check for Obvious Issues

- Are there O(n^2) operations where O(n) is straightforward?
- Are there repeated computations that could be cached or hoisted?
- Are there unnecessary allocations in hot paths?
- Is data being transformed multiple times when once would suffice?

**Only fix efficiency issues that are obvious. Do not optimize without evidence of a problem.**

## Review Checklist

| Category | Question | Action if Yes |
|----------|----------|---------------|
| Duplication | Same logic exists elsewhere? | Extract shared helper or reuse existing |
| Duplication | Copy-paste from another file? | Extract to shared module |
| Dead code | Unused imports or variables? | Delete them |
| Dead code | Commented-out code? | Delete it (git has history) |
| Complexity | Abstraction for one call site? | Inline it |
| Complexity | Generic where specific suffices? | Simplify to specific |
| Complexity | Config for hypothetical needs? | Remove until needed |
| Clarity | Confusing variable name? | Rename to describe purpose |
| Clarity | Deep nesting? | Flatten with early returns |
| Efficiency | O(n^2) with obvious O(n) fix? | Fix it now |
| Efficiency | Same computation in a loop? | Hoist outside the loop |

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "It works, don't touch it" | Working is the minimum bar. Simplify before it becomes legacy. |
| "We might need the flexibility later" | YAGNI. Add flexibility when you need it, not before. |
| "Refactoring is risky" | Small simplifications with passing tests are safe. Large refactors are a separate task. |
| "The duplication is minor" | Minor duplication compounds. Three occurrences is the threshold, not six. |
| "I'll clean it up in a follow-up" | Follow-ups rarely happen. Simplify now while context is fresh. |
| "It's just a few extra lines" | Every unnecessary line is maintenance cost. Delete it. |

## Red Flags — STOP If You Catch Yourself:

- Committing without reading your own diff
- Keeping dead code "just in case"
- Adding a utility class for a single use case
- Building configuration for features no one has requested
- Writing a comment to explain code that could be rewritten to be self-evident
- Skipping simplification because "it's good enough"

**If any red flag triggers: STOP. Review the diff again. Simplify before committing.**

## Verification Checklist

Before committing, confirm:

- [ ] All staged changes have been reviewed line by line
- [ ] No duplication with existing codebase logic (or duplication is below threshold)
- [ ] No dead code: unused imports, variables, unreachable branches, commented code
- [ ] No unnecessary abstractions, wrappers, or premature generalizations
- [ ] Naming is clear and consistent with codebase conventions
- [ ] No obvious efficiency issues (unnecessary O(n^2), repeated computations)
- [ ] Tests still pass after simplification changes

## In MAXSIM Plan Execution

Simplification applies at the task level, after implementation and before commit:
- After task implementation is complete and tests pass, run this review
- Make simplification changes as part of the same commit (not a separate task)
- If simplification reveals a larger refactoring opportunity, file a todo — do not scope-creep
- Track significant simplifications in the task's commit message (e.g., "extracted shared helper for X")
