---
name: brainstorming
description: >-
  Explores multiple implementation approaches with trade-off analysis before
  committing to a design direction. Use when starting a significant feature,
  making architectural decisions, or choosing between design alternatives.
---

# Brainstorming

The first idea is rarely the best idea. Explore the space before committing to a direction.

**HARD GATE** -- No implementation without design approval. If you have not presented approaches, discussed trade-offs, and received explicit user approval, you cannot write implementation code. This is not a judgment call.

## Process

### 1. Frame the Problem

Ask the user ONE question at a time to understand the problem space. Each answer informs the next question.

- What is the goal? What does success look like?
- What are the constraints (performance, compatibility, timeline)?
- What has been tried or considered already?
- What are the non-negotiables vs. nice-to-haves?

### 2. Research Context

Before proposing solutions, gather evidence from the codebase and any existing planning artifacts. Read relevant code, check for prior decisions, and identify patterns already in use.

### 3. Present 2-3 Approaches

For each approach, provide:

| Aspect | Content |
|--------|---------|
| **Summary** | One sentence |
| **How it works** | 3-5 implementation bullets |
| **Pros** | Concrete advantages (not vague -- "200 fewer lines" beats "simpler") |
| **Cons** | Honest drawbacks -- do not hide weaknesses |
| **Effort** | Low / Medium / High |
| **Risk** | What could go wrong and how recoverable |

Present exactly 2-3 approaches. If one is clearly superior, say so -- but still present alternatives so the user can validate your reasoning.

### 4. Discuss and Refine

Ask the user which approach they prefer or whether they want a hybrid. Answer follow-up questions honestly. If no approach fits, propose new ones informed by the discussion. Continue one question at a time -- do not assume consensus.

### 5. Get Explicit Approval

The user must explicitly approve one approach (e.g., "Go with A", "Approved", "Ship it"). Vague responses like "Sounds good" or "Interesting" are not approval. If ambiguous, ask: "To confirm -- should I proceed with [specific approach]?"

### 6. Document the Decision

Record the chosen approach, rejected alternatives with reasons, key implementation decisions, and risks. Use MAXSIM state tooling if available.

### 7. Implement the Approved Design

Only after steps 1-6. Follow the approved design. If implementation reveals a design flaw, stop and return to step 4.

## Common Pitfalls

| Excuse | Reality |
|--------|---------|
| "I already know the best approach" | You know your preferred approach. Alternatives may be better. |
| "There's only one way to do this" | There is almost never only one way. |
| "Brainstorming slows us down" | Building the wrong thing is slower. 30 minutes of design saves days of rework. |

Stop immediately if you catch yourself: writing code before presenting approaches, presenting only one option, asking multiple questions at once, assuming approval without explicit confirmation, or skipping documentation.

## Verification

Before starting implementation, confirm:

- [ ] Problem has been framed with user input (not assumptions)
- [ ] Relevant code and context have been researched
- [ ] 2-3 approaches presented with concrete trade-offs
- [ ] User has explicitly approved one specific approach
- [ ] Decision has been recorded
- [ ] Design doc captures chosen approach, rejected alternatives, and risks

## MAXSIM Integration

Brainstorming applies before significant implementation work within MAXSIM workflows:

- Use during phase planning when design choices affect multiple tasks
- Use before any task introducing new architecture, patterns, or external dependencies
- Decision records in STATE.md persist across sessions -- future agents inherit context
- If a session spans multiple interactions, record partial progress in STATE.md blockers
