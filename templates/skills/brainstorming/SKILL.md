---
name: brainstorming
description: Use before implementing any significant feature or design — requires exploring multiple approaches and getting explicit design approval before writing code
---

# Brainstorming

The first idea is rarely the best idea. Explore the space before committing to a direction.

**If you have not considered alternatives, you are building the first thing that came to mind.**

## The Iron Law

<HARD-GATE>
NO IMPLEMENTATION WITHOUT DESIGN APPROVAL.
If you have not presented approaches, discussed trade-offs, and received explicit approval, you CANNOT write implementation code.
"I already know the best approach" is an assumption, not a conclusion.
Violating this rule is a violation — not a judgment call.
</HARD-GATE>

## The Gate Function

Follow these steps IN ORDER before implementing any significant feature, architecture change, or design decision.

### 1. FRAME — Define the Problem

Ask the user ONE question at a time to understand the problem space. Do not bundle multiple questions — each response informs the next question.

- What is the goal? What does success look like?
- What are the constraints (performance, compatibility, timeline)?
- What has already been tried or considered?
- What are the non-negotiables vs. nice-to-haves?

**Rule: ONE question at a time. Wait for the answer before asking the next.**

### 2. RESEARCH — Understand the Context

Before proposing solutions, gather evidence:

- Read the relevant code and understand current architecture
- Check `.planning/` for existing decisions and constraints
- Review ROADMAP.md for phase dependencies and scope
- Identify related patterns already in the codebase

```bash
# Check existing decisions
node ~/.claude/maxsim/bin/maxsim-tools.cjs state read --raw

# Check current roadmap context
node ~/.claude/maxsim/bin/maxsim-tools.cjs roadmap read --raw
```

### 3. PROPOSE — Present 2-3 Approaches

For each approach, provide:

| Aspect | What to Include |
|--------|----------------|
| **Summary** | One-sentence description of the approach |
| **How it works** | Key implementation steps (3-5 bullets) |
| **Pros** | Concrete advantages — not vague ("simpler" is vague, "200 fewer lines" is concrete) |
| **Cons** | Honest drawbacks — do not hide weaknesses to sell a preferred option |
| **Effort** | Relative complexity (low / medium / high) |
| **Risk** | What could go wrong and how recoverable is it |

**Present exactly 2-3 approaches.** One option is not brainstorming. Four or more creates decision paralysis.

If one approach is clearly superior, say so — but still present alternatives so the user can validate your reasoning.

### 4. DISCUSS — Refine with the User

- Ask the user which approach they prefer (or if they want a hybrid)
- Answer follow-up questions honestly — do not advocate for a single approach
- If the user raises concerns, address them specifically
- If no approach fits, propose new ones informed by the discussion

**Continue ONE question at a time. Do not assume consensus until stated.**

### 5. DECIDE — Get Explicit Approval

The user must explicitly approve the chosen approach. Acceptable approvals:

- "Go with approach A"
- "Let's do option 2"
- "Approved" / "LGTM" / "Ship it"

Not acceptable as approval:

- "Sounds good" (too vague — clarify which approach)
- "Interesting" (not a decision)
- Silence (not consent)

**If approval is ambiguous, ask: "To confirm — should I proceed with [specific approach]?"**

### 6. DOCUMENT — Record the Decision

After approval, write a design doc and record the decision:

```bash
# Record the decision in STATE.md
node ~/.claude/maxsim/bin/maxsim-tools.cjs add-decision \
  --phase "current-phase" \
  --summary "Chose approach X for [feature] because [reason]" \
  --rationale "Evaluated 3 approaches: A (rejected — too complex), B (rejected — performance risk), C (approved — best trade-off of simplicity and extensibility)"
```

The design doc should include:
- **Chosen approach** and why
- **Rejected alternatives** and why they were rejected
- **Key implementation decisions** that flow from the choice
- **Risks** and mitigation strategies

### 7. IMPLEMENT — Build the Approved Design

Only after steps 1-6 are complete:
- Follow the approved design — do not deviate without re-discussion
- If implementation reveals a flaw in the design, STOP and return to step 4
- Reference the design doc in commit messages

## Common Rationalizations — REJECT THESE

| Excuse | Why It Violates the Rule |
|--------|--------------------------|
| "I already know the best approach" | You know YOUR preferred approach. Alternatives may be better. |
| "There's only one way to do this" | There is almost never only one way. You have not looked hard enough. |
| "The user won't care about the design" | Users care about the outcome. Bad design leads to bad outcomes. |
| "Brainstorming slows us down" | Building the wrong thing is slower. 30 minutes of design saves days of rework. |
| "I'll refactor if the first approach is wrong" | Refactoring is expensive. Choosing well upfront is cheaper. |
| "The scope is too small for brainstorming" | If it touches architecture, it needs brainstorming regardless of size. |

## Red Flags — STOP If You Catch Yourself:

- Writing implementation code before presenting approaches to the user
- Presenting only one approach and calling it "brainstorming"
- Asking multiple questions at once instead of one at a time
- Assuming approval without an explicit statement
- Skipping the documentation step because "we'll remember"
- Deviating from the approved design without discussion

**If any red flag triggers: STOP. Return to the appropriate step.**

## Verification Checklist

Before starting implementation, confirm:

- [ ] Problem has been framed with user input (not assumptions)
- [ ] Relevant code and context have been researched
- [ ] 2-3 approaches have been presented with concrete trade-offs
- [ ] User has explicitly approved one specific approach
- [ ] Decision has been recorded in STATE.md
- [ ] Design doc captures chosen approach, rejected alternatives, and risks

## In MAXSIM Plan Execution

Brainstorming applies before significant implementation work:
- Use during phase planning when design choices affect multiple tasks
- Use before any task that introduces new architecture, patterns, or external dependencies
- The decision record in STATE.md persists across sessions — future agents inherit context
- If a brainstorming session spans multiple interactions, record partial progress in STATE.md blockers
