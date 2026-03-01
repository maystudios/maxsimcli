---
name: code-review
description: Use after completing a phase or significant implementation — requires reviewing all changed code for critical issues before sign-off
---

# Code Review

Shipping unreviewed code is shipping unknown risk. Review before sign-off.

**If you have not reviewed every changed file, you cannot approve the phase.**

## The Iron Law

<HARD-GATE>
NO PHASE SIGN-OFF WITHOUT REVIEWING ALL CHANGED CODE.
If you have not read every diff introduced in this phase, you CANNOT mark it complete.
"It works" is not "it's correct." Passing tests do not prove code quality.
Violating this rule is a violation — not a shortcut.
</HARD-GATE>

## The Gate Function

Follow these steps IN ORDER before approving any phase or significant implementation.

### 1. SCOPE — Identify All Changes

- Run `git diff` against the phase's starting point to see every changed file
- List all new files, modified files, and deleted files
- Do NOT skip generated files, config changes, or "minor" edits

```bash
# Example: see all changes since phase branch point
git diff --stat main...HEAD
git diff main...HEAD
```

### 2. SECURITY — Check for Vulnerabilities

Review every changed file for:

| Category | What to Look For |
|----------|-----------------|
| Injection | Unsanitized user input in SQL, shell commands, HTML output, template strings |
| Authentication | Missing auth checks, hardcoded credentials, tokens in source |
| Authorization | Missing permission checks, privilege escalation paths |
| Data exposure | Secrets in logs, overly broad API responses, sensitive data in error messages |
| Dependencies | New dependencies with known vulnerabilities, unnecessary dependencies |

**Any security issue is a blocking finding. No exceptions.**

### 3. INTERFACES — Verify API Contracts

- Do public function signatures match their documentation?
- Are return types accurate and complete?
- Do error types cover all failure modes?
- Are breaking changes documented and intentional?
- Do exported interfaces maintain backward compatibility (or is the break intentional)?

### 4. ERROR HANDLING — Check Failure Paths

- Are all external calls (I/O, network, user input) wrapped in error handling?
- Do error messages provide enough context to diagnose the issue?
- Are errors propagated correctly (not swallowed silently)?
- Are edge cases handled (empty input, null values, boundary conditions)?

### 5. TESTS — Evaluate Coverage

- Does every new public function have corresponding tests?
- Do tests cover both success and failure paths?
- Are edge cases tested (empty, null, boundary, error conditions)?
- Do tests verify behavior, not implementation details?

### 6. QUALITY — Assess Maintainability

- Is naming consistent with the existing codebase conventions?
- Are there code duplication opportunities that should be extracted?
- Is the complexity justified by the requirements?
- Are comments present where logic is non-obvious (and absent where code is self-evident)?

## Critical Issues — Block Phase Sign-Off

These categories MUST be resolved before the phase can be marked complete:

| Severity | Category | Example |
|----------|----------|---------|
| **Blocker** | Security vulnerability | SQL injection, XSS, hardcoded secrets |
| **Blocker** | Broken interface | Public API returns wrong type, missing required field |
| **Blocker** | Missing error handling | Unhandled promise rejection, swallowed exceptions on I/O |
| **Blocker** | Data loss risk | Destructive operation without confirmation, missing transaction |
| **High** | Performance regression | O(n^2) where O(n) is trivial, unbounded memory allocation |
| **High** | Missing critical tests | No tests for error paths, no tests for new public API |
| **Medium** | Naming inconsistency | Convention mismatch with existing codebase |
| **Medium** | Dead code | Unreachable branches, unused imports, commented-out code |

**Blocker and High severity issues block sign-off. Medium issues should be filed for follow-up.**

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "Tests pass, so the code is fine" | Tests verify behavior, not code quality. Review is separate. |
| "I wrote it, so I know it's correct" | Author bias is real. Review as if someone else wrote it. |
| "It's just a small change" | Small changes cause large outages. Review proportional effort, not zero effort. |
| "We'll clean it up later" | "Later" accumulates. Fix blockers now, file medium issues. |
| "The deadline is tight" | Shipping broken code costs more time than reviewing. |
| "Generated code doesn't need review" | Generated code has the same bugs. Review it. |

## Red Flags — STOP If You Catch Yourself:

- Skipping files because they "look fine" from the diff stat
- Approving without reading the actual code changes
- Ignoring a gut feeling that something is wrong
- Rushing through review to meet a deadline
- Assuming tests cover everything without checking
- Skipping error handling review because "the happy path works"

**If any red flag triggers: STOP. Go back to step 1 (SCOPE) and review properly.**

## Verification Checklist

Before signing off on a phase, confirm:

- [ ] All changed files have been reviewed (not just the "important" ones)
- [ ] No security vulnerabilities found (or all found issues resolved)
- [ ] Public interfaces match their contracts and documentation
- [ ] Error handling covers all external calls and edge cases
- [ ] Test coverage exists for new public functions and error paths
- [ ] Naming and style are consistent with codebase conventions
- [ ] No blocker or high severity issues remain open

## Review Output Format

Produce a review summary for phase documentation:

```
REVIEW SCOPE: [number] files changed, [number] additions, [number] deletions
SECURITY: PASS | ISSUES FOUND (list)
INTERFACES: PASS | ISSUES FOUND (list)
ERROR HANDLING: PASS | ISSUES FOUND (list)
TEST COVERAGE: PASS | GAPS FOUND (list)
QUALITY: PASS | ISSUES FOUND (list)
VERDICT: APPROVED | BLOCKED (list blocking issues)
```

## In MAXSIM Plan Execution

Code review applies at phase boundaries:
- After all tasks in a phase are complete, run this review before marking the phase done
- Blocking issues must be resolved before phase completion
- Medium issues should be captured as todos for the next phase
- The review summary should be included in the phase SUMMARY.md
