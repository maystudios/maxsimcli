---
name: simplify
description: >-
  Reviews changed code for reuse opportunities, unnecessary complexity, and
  dead weight using three parallel review agents. Use when reviewing code
  before committing, cleaning up implementations, or preparing changes for
  review.
---

# Simplify

Every line of code is a liability. Remove what does not earn its place.

**HARD GATE**: No code ships without a simplification pass. If you have not checked for duplication, dead code, and unnecessary complexity, the change is not ready. "It works" is the starting point, not the finish line.

## When to Use

- After implementing a feature or fix, before committing
- When preparing changes for code review
- When cleaning up code that has grown organically over multiple iterations
- When onboarding to a file and noticing accumulated complexity

Do NOT use this skill when:
- Making a hotfix where speed matters more than polish (file a follow-up instead)
- The changes are purely mechanical (renames, formatting, dependency bumps)

## Process

### 1. DIFF — Identify What Changed

- Collect the set of modified and added files
- Read each file in full, not just the changed hunks
- Note files that interact with the changes (callers, consumers, shared modules)

### 2. DUPLICATION — Eliminate Repeated Logic

- Are there patterns repeated across files that should be a shared helper?
- Does new code duplicate existing utilities or library functions?
- Could two similar implementations be merged behind a single interface?
- Is there copy-paste that should be refactored?

**Rule of three**: If the same pattern appears three times, extract it.

### 3. DEAD CODE — Remove What Is Not Called

- Delete unused imports, variables, functions, and parameters
- Remove commented-out code blocks (version control is the archive)
- Strip unreachable branches and impossible conditions
- Drop feature flags and configuration for features that no longer exist

### 4. COMPLEXITY — Question Every Abstraction

- Does every wrapper, adapter, or indirection layer justify its existence?
- Are there generics or parametrization that serve only one concrete case?
- Could a 20-line class be replaced by a 3-line function?
- Is there defensive programming that guards against conditions that cannot occur?

**If removing it does not break anything, it should not be there.**

### 5. CLARITY — Tighten Naming and Structure

- Are names self-documenting? Rename anything that needs a comment to explain.
- Could nested logic be flattened with early returns?
- Is control flow straightforward, or does it require tracing to understand?
- Are there layers of indirection that obscure the data path?

### 6. REVIEW — Final Sanity Check

- Re-read the simplified code end to end
- Confirm all tests still pass
- Verify no behavioral changes were introduced (simplify, do not alter)

## Parallel 3-Reviewer Pattern

When invoked as part of the execute-phase cycle, simplification runs as three parallel review agents, each focused on one dimension.

### Reviewer 1: Code Reuse

- Scan all changed files for duplicated patterns
- Cross-reference against existing shared utilities and helpers
- Flag any logic that appears three or more times without extraction
- **Output**: List of reuse opportunities with file paths and line ranges

### Reviewer 2: Code Quality

- Check for dead code: unused imports, unreachable branches, commented blocks
- Verify naming consistency with codebase conventions
- Flag unnecessary abstractions, wrappers, and indirection
- **Output**: List of quality issues categorized by severity

### Reviewer 3: Efficiency

- Identify over-engineered solutions (parametrization serving one case, generic interfaces with one implementor)
- Flag defensive programming that guards impossible conditions
- Check for configuration and feature flags that serve no current purpose
- **Output**: List of efficiency issues with suggested removals

### Consolidation

After all three reviewers complete:
1. Merge findings into a deduplicated list
2. Apply fixes for all actionable items (BLOCKER and HIGH priority first)
3. Re-run tests to confirm nothing broke
4. Report status: CLEAN (nothing found), FIXED (issues resolved), or BLOCKED (cannot simplify without architectural changes)

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "It might be needed later" | Delete it. Re-adding is cheaper than maintaining unused code. |
| "The abstraction makes it extensible" | Extensibility that serves no current requirement is dead weight. |
| "Refactoring is risky" | Small, tested simplifications reduce risk. Accumulated complexity increases it. |
| "I'll clean it up later" | Later never comes. Simplify now while context is fresh. |

## Red Flags — STOP If You Catch Yourself:

- Skipping the simplification pass because the diff is small
- Keeping dead code "just in case"
- Adding complexity during a simplification pass
- Merging without having read the full file (not just changed lines)

**If any red flag triggers: STOP. Complete the simplification cycle before proceeding.**

## Verification Checklist

Before reporting completion, confirm:

- [ ] All changed files were reviewed in full (not just diffs)
- [ ] No duplicated logic remains that appears three or more times
- [ ] No dead code: unused imports, commented blocks, unreachable branches
- [ ] No unnecessary abstractions, wrappers, or indirection layers
- [ ] All tests pass after simplification
- [ ] No behavioral changes were introduced (simplify only, do not alter)

## MAXSIM Integration

When a plan specifies `skill: "simplify"`:
- The orchestrator collects changed files from the implementation step
- Three parallel reviewers (Reuse, Quality, Efficiency) are spawned
- Findings are consolidated and fixes applied
- Progress is tracked in STATE.md via decision entries
- Final results are recorded in SUMMARY.md
