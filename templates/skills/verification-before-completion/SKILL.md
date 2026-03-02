---
name: verification-before-completion
description: >-
  Requires running verification commands and reading actual output before making
  any completion claims. Use when claiming work is done, tests pass, builds
  succeed, or bugs are fixed. Prevents false completion claims.
---

# Verification Before Completion

Evidence before claims, always.

**HARD GATE -- No completion claims without fresh verification evidence. If you have not run the verification command in this turn, you cannot claim it passes. "Should work" is not evidence. "I'm confident" is not evidence.**

## Process

Before claiming any status or marking a task done:

1. **IDENTIFY** -- What command proves this claim?
2. **RUN** -- Execute the full command fresh in this turn (not a previous run)
3. **READ** -- Read the full output, check the exit code, count failures
4. **VERIFY** -- Does the output actually confirm the claim?
   - If NO: state the actual status with evidence
   - If YES: state the claim with the evidence
5. **CLAIM** -- Only now may you assert completion

### Evidence Block Format

When claiming task completion, build completion, or test passage, produce:

```
CLAIM: [what you are claiming]
EVIDENCE: [exact command run in this turn]
OUTPUT: [relevant excerpt of actual output]
VERDICT: PASS | FAIL
```

This format is required for task completion claims in MAXSIM plan execution. It is not required for intermediate status updates.

### What Counts as Verification

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| "Tests pass" | Test command output showing 0 failures | Previous run, "should pass", partial run |
| "Build succeeds" | Build command with exit code 0 | Linter passing, "logs look clean" |
| "Bug is fixed" | Original failing test now passes | "Code changed, assumed fixed" |
| "Task is complete" | All done criteria checked with evidence | "I implemented everything in the plan" |
| "No regressions" | Full test suite passing | "I only changed one file" |

## Common Pitfalls

| Excuse | Why It Fails |
|--------|-------------|
| "Should work now" | "Should" is not evidence. Run the command. |
| "I'm confident in the logic" | Confidence is not evidence. Run it. |
| "The linter passed" | Linter passing does not mean tests pass or build succeeds. |
| "I only changed one line" | One line can break everything. Verify. |
| "The subagent reported success" | Trust test output and VCS diffs, not agent reports. |

Stop if you catch yourself using "should", "probably", or "looks good" about unverified work, or expressing satisfaction before running verification.

## Verification

Before marking any work as complete:

- [ ] Identified the verification command for every claim
- [ ] Ran each verification command fresh in this turn
- [ ] Read the full output (not just the summary line)
- [ ] Checked exit codes (0 = success, non-zero = failure)
- [ ] Evidence supports every completion claim
- [ ] No "should", "probably", or "seems to" in your completion statement
- [ ] Evidence block produced for the task completion claim

## MAXSIM Integration

The executor's task commit protocol requires verification before committing:

1. Run the task's verify block (automated checks)
2. Confirm the done criteria are met with evidence
3. Produce an evidence block for the task completion
4. Only then: stage files and commit

The verifier agent independently re-checks all claims -- do not assume the verifier will catch what you missed.
