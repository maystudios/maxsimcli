---
name: code-review
description: >-
  Reviews all changed code for security vulnerabilities, interface correctness,
  error handling, test coverage, and quality before sign-off. Use when completing
  a phase, reviewing implementation, or before approving changes for merge.
---

# Code Review

Shipping unreviewed code is shipping unknown risk. Review before sign-off.

**HARD GATE: NO PHASE SIGN-OFF WITHOUT REVIEWING ALL CHANGED CODE.** If every diff introduced in this phase has not been read, the phase cannot be marked complete. Passing tests do not prove code quality.

## Process

Follow these steps in order before approving any phase or significant implementation.

### 1. SCOPE -- Identify All Changes

- Diff against the phase starting point to see every changed file
- List all new, modified, and deleted files
- Do not skip generated files, config changes, or minor edits

### 2. SECURITY -- Check for Vulnerabilities

Review every changed file for:

| Category | What to Look For |
|----------|-----------------|
| Injection | Unsanitized user input in SQL, shell commands, HTML output, template strings |
| Authentication | Missing auth checks, hardcoded credentials, tokens in source |
| Authorization | Missing permission checks, privilege escalation paths |
| Data exposure | Secrets in logs, overly broad API responses, sensitive data in error messages |
| Dependencies | New dependencies with known vulnerabilities, unnecessary dependencies |

**Any security issue is a blocking finding. No exceptions.**

### 3. INTERFACES -- Verify API Contracts

- Do public function signatures match their documentation?
- Are return types accurate and complete?
- Do error types cover all failure modes?
- Are breaking changes documented and intentional?
- Do exported interfaces maintain backward compatibility?

### 4. ERROR HANDLING -- Check Failure Paths

- Are all external calls wrapped in error handling?
- Do error messages provide enough context to diagnose the issue?
- Are errors propagated correctly (not swallowed silently)?
- Are edge cases handled (empty input, null values, boundary conditions)?

### 5. TESTS -- Evaluate Coverage

- Does every new public function have corresponding tests?
- Do tests cover both success and failure paths?
- Are edge cases tested?
- Do tests verify behavior, not implementation details?

### 6. QUALITY -- Assess Maintainability

- Is naming consistent with existing codebase conventions?
- Are there duplication opportunities that should be extracted?
- Is the complexity justified by the requirements?
- Are comments present where logic is non-obvious?

## Common Pitfalls

| Issue | Reality |
|-------|---------|
| "Tests pass, so the code is fine" | Tests verify behavior, not code quality. Review is separate. |
| "I wrote it, so I know it's correct" | Author bias is real. Review as if someone else wrote it. |
| "It's just a small change" | Small changes cause large outages. |
| "Generated code doesn't need review" | Generated code has the same bugs. Review it. |

Stop if you catch yourself skipping files because they "look fine," approving without reading actual code, or rushing through review to meet a deadline.

## Verification

Before signing off on a phase, confirm:

- [ ] All changed files have been reviewed (not just the "important" ones)
- [ ] No security vulnerabilities found (or all found issues resolved)
- [ ] Public interfaces match their contracts and documentation
- [ ] Error handling covers all external calls and edge cases
- [ ] Test coverage exists for new public functions and error paths
- [ ] Naming and style are consistent with codebase conventions
- [ ] No blocker or high severity issues remain open

### Severity Reference

| Severity | Category | Example |
|----------|----------|---------|
| Blocker | Security vulnerability | SQL injection, XSS, hardcoded secrets |
| Blocker | Broken interface | Public API returns wrong type |
| Blocker | Data loss risk | Destructive operation without confirmation |
| High | Performance regression | O(n^2) where O(n) is trivial |
| High | Missing critical tests | No tests for error paths or new public API |
| Medium | Naming inconsistency | Convention mismatch with existing codebase |
| Medium | Dead code | Unreachable branches, unused imports |

Blocker and High severity issues block sign-off. Medium issues should be filed for follow-up.

### Review Output Format

```
REVIEW SCOPE: [number] files changed, [number] additions, [number] deletions
SECURITY: PASS | ISSUES FOUND (list)
INTERFACES: PASS | ISSUES FOUND (list)
ERROR HANDLING: PASS | ISSUES FOUND (list)
TEST COVERAGE: PASS | GAPS FOUND (list)
QUALITY: PASS | ISSUES FOUND (list)
VERDICT: APPROVED | BLOCKED (list blocking issues)
```

## MAXSIM Integration

Code review applies at phase boundaries:
- After all tasks in a phase are complete, run this review before marking the phase done
- Blocking issues must be resolved before phase completion
- Medium issues should be captured as todos for the next phase
- The review summary should be included in the phase SUMMARY.md
