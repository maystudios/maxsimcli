---
name: verification-before-completion
description: Use before claiming any work is complete, fixed, or passing — requires running verification commands and reading output before making success claims
---

# Verification Before Completion

Claiming work is complete without verification is dishonesty, not efficiency.

**Evidence before claims, always.**

## The Iron Law

<HARD-GATE>
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.
If you have not run the verification command in this turn, you CANNOT claim it passes.
"Should work" is not evidence. "I'm confident" is not evidence.
Violating this rule is a violation — not a special case.
</HARD-GATE>

## The Gate Function

BEFORE claiming any status, expressing satisfaction, or marking a task done:

1. **IDENTIFY:** What command proves this claim?
2. **RUN:** Execute the FULL command (fresh, in this turn — not a previous run)
3. **READ:** Read the FULL output. Check the exit code. Count failures.
4. **VERIFY:** Does the output actually confirm the claim?
   - If NO: State the actual status with evidence
   - If YES: State the claim WITH the evidence
5. **CLAIM:** Only now may you assert completion

**Skip any step = lying, not verifying.**

### Evidence Block Format

When claiming task completion, build completion, or test passage, produce:

```
CLAIM: [what you are claiming]
EVIDENCE: [exact command run in this turn]
OUTPUT: [relevant excerpt of actual output]
VERDICT: PASS | FAIL
```

This format is required for task completion claims in MAXSIM plan execution. It is NOT required for intermediate status updates like "I have read the file" or "here is the plan."

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "Should work now" | "Should" is not evidence. RUN the command. |
| "I'm confident in the logic" | Confidence is not evidence. Run it. |
| "The linter passed" | Linter passing does not mean tests pass or build succeeds. |
| "Just this once" | NO EXCEPTIONS. This is the rule, not a guideline. |
| "I only changed one line" | One line can break everything. Verify. |
| "The subagent reported success" | Trust test output and VCS diffs, not agent reports. |
| "Partial check is enough" | Partial proves nothing about the unchecked parts. |

## Red Flags — STOP If You Catch Yourself:

- Using "should", "probably", "seems to", or "looks good" about unverified work
- Expressing satisfaction ("Great!", "Perfect!", "Done!") before running verification
- About to commit or push without running the test/build command in THIS turn
- Trusting a subagent's completion report without independent verification
- Thinking "the last run was clean, I only changed one line"
- About to mark a MAXSIM task as done without running the `<verify>` block
- Relying on a previous turn's test output as current evidence

**If any red flag triggers: STOP. Run the command. Read the output. THEN make the claim.**

## What Counts as Verification

| Claim | Requires | NOT Sufficient |
|-------|----------|----------------|
| "Tests pass" | Test command output showing 0 failures | Previous run, "should pass", partial run |
| "Build succeeds" | Build command with exit code 0 | Linter passing, "logs look clean" |
| "Bug is fixed" | Original failing test now passes | "Code changed, assumed fixed" |
| "Task is complete" | All done criteria checked with evidence | "I implemented everything in the plan" |
| "No regressions" | Full test suite passing | "I only changed one file" |

## Verification Checklist

Before marking any work as complete:

- [ ] Identified the verification command for every claim
- [ ] Ran each verification command fresh in this turn
- [ ] Read the full output (not just the summary line)
- [ ] Checked exit codes (0 = success, non-zero = failure)
- [ ] Evidence supports every completion claim
- [ ] No "should", "probably", or "seems to" in your completion statement
- [ ] Evidence block produced for the task completion claim

## In MAXSIM Plan Execution

The executor's task commit protocol requires verification BEFORE committing:
1. Run the task's `<verify>` block (automated checks)
2. Confirm the `<done>` criteria are met with evidence
3. Produce an evidence block for the task completion
4. Only then: stage files and commit

The verifier agent independently re-checks all claims — do not assume the verifier will catch what you missed.
